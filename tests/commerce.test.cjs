const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
function load(file, mocks = {}) {
  const absolute = path.resolve(file);
  const source = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (id) => {
    if (id in mocks) return mocks[id];
    if (id === "server-only") return {};
    if (id.startsWith("@/")) return load(id.slice(2) + ".ts", mocks);
    if (id.startsWith("."))
      return load(path.resolve(path.dirname(absolute), id + ".ts"), mocks);
    return require(id);
  };
  new Function("require", "module", "exports", source)(
    localRequire,
    module,
    module.exports,
  );
  return module.exports;
}
const commerce = load("data/commerce.ts");
const store = load("data/store.ts");
function catalog(rows, stock = [], error = null) {
  const client = {
    from(table) {
      const builder = {
        select() {
          return this;
        },
        order() {
          return this;
        },
        eq() {
          return this;
        },
        in() {
          return this;
        },
        then(resolve) {
          return Promise.resolve({
            data: table === "products" ? rows : stock,
            error,
          }).then(resolve);
        },
      };
      return builder;
    },
  };
  return load("src/lib/catalog.ts", {
    "@/src/lib/supabaseAdmin": { getSupabaseAdmin: () => client },
  });
}
test("public Nayiomi URLs keep legacy order and review identifiers", () => {
  assert.equal(
    commerce.productUrl("naomi-boxing-strike-tee"),
    "/drop/nayiomi-boxing-strike-tee",
  );
  assert.equal(
    commerce.internalProductSlug("nayiomi-boxing-strike-tee"),
    "naomi-boxing-strike-tee",
  );
  assert.equal(
    commerce.productUrl("after-limits-001"),
    "/drop/after-limits-001",
  );
});
test("sold out takes precedence over made-to-order messaging", () => {
  assert.equal(commerce.availabilityLabel(0, true), "Agotado");
  assert.equal(commerce.availabilityLabel(20, true), "Disponible sobre pedido");
});
test("local delivery only accepts five digits in configured zones", () => {
  assert.equal(store.isFreePersonalDeliveryPostalCode("72500"), true);
  assert.equal(store.isFreePersonalDeliveryPostalCode("01000"), false);
  assert.equal(store.isFreePersonalDeliveryPostalCode("725000"), false);
});
test("hidden current-drop database row cannot be resurrected by local fallback", async () => {
  const api = catalog([
    {
      id: "1",
      slug: "naomi-boxing-strike-tee",
      name: "Boxing Strike",
      price_mxn: 359,
      active: false,
      status: "hidden",
    },
  ]);
  const products = await api.getCatalogProducts();
  assert.equal(
    products.some((p) => p.slug === "naomi-boxing-strike-tee"),
    false,
  );
});
test("database prices win and unavailable stock is never borrowed", async () => {
  const api = catalog(
    [
      {
        id: "1",
        slug: "test-tee",
        name: "Test",
        price_mxn: 360,
        active: true,
        status: "active",
      },
    ],
    [],
  );
  const products = await api.getCatalogProducts();
  const product = products.find((p) => p.slug === "test-tee");
  assert.equal(product.priceMxn, 360);
  assert.equal(
    product.stock.reduce((sum, s) => sum + s.available, 0),
    0,
  );
  assert.equal(product.material, "Por confirmar");
});
test("checkout fails closed when authoritative catalog cannot be read", async () => {
  assert.deepEqual(
    await catalog(null, [], { code: "unavailable" }).getCatalogProducts({
      requireLive: true,
    }),
    [],
  );
});
test("local current drop remains purchasable when absent in healthy database", async () => {
  const products = await catalog([
    {
      id: "1",
      slug: "old",
      name: "Old",
      price_mxn: 359,
      active: true,
      status: "active",
    },
  ]).getCatalogProducts({ requireLive: true });
  assert.equal(products.filter(commerce.isCurrentDrop).length, 3);
});

const wholesale = load("data/wholesale.ts");
const rule = (overrides = {}) => ({ id: "tier-6", product_slug: "tee", min_quantity: 6, discount_type: "fixed", discount_value: 30, active: true, ...overrides });
test("wholesale combines sizes of one model but never different models", () => {
  const result = wholesale.calculateWholesale([{ slug: "tee", priceMxn: 359, quantity: 3 }, { slug: "tee", priceMxn: 359, quantity: 3 }, { slug: "hoodie", priceMxn: 459, quantity: 5 }], [rule(), rule({ product_slug: "hoodie" })]);
  assert.equal(result.discountMxn, 180);
  assert.equal(result.lines[2].discountMxn, 0);
  assert.equal(wholesale.calculateWholesale([{ slug: "tee", priceMxn: 359, quantity: 5 }], [rule()]).discountMxn, 0);
});
test("wholesale chooses best eligible tier, not sum, and ignores paused tiers", () => {
  const result = wholesale.calculateWholesale([{ slug: "tee", priceMxn: 359, quantity: 12 }], [rule(), rule({ id: "tier-12", min_quantity: 12, discount_type: "percent", discount_value: 15 }), rule({ active: false, discount_value: 100 })]);
  assert.equal(result.discountMxn, 646.2);
  assert.equal(result.lines[0].rule.id, "tier-12");
  assert.equal(wholesale.chooseDiscount(646.2, 100).discountMxn, 646.2);
  assert.equal(wholesale.chooseDiscount(180, 200).wholesaleApplied, false);
});
test("wholesale keeps prices positive after a catalog price reduction", () => {
  assert.equal(wholesale.calculateWholesale([{ slug: "tee", priceMxn: 10, quantity: 6 }], [rule()]).discountMxn, 59.94);
});
test("wholesale input rejects unsafe, fractional or excessive thresholds and invalid discounts", () => {
  for (const patch of [{ min_quantity: 1 }, { min_quantity: 2.5 }, { min_quantity: 501 }, { discount_value: -1 }, { discount_type: "percent", discount_value: 100 }, { discount_value: Infinity }, { discount_value: 1.001 }, { active: "true" }, { product_slug: "../x" }]) {
    assert.throws(() => wholesale.validateWholesaleRule(rule(patch)));
  }
  assert.equal(wholesale.validateWholesaleRule(rule({ min_quantity: 500 })).min_quantity, 500);
});
for (const routeFile of ["app/api/clip/checkout/route.ts", "app/api/checkout/transfer/route.ts"]) {
  test(`${routeFile}: authoritative prices, per-model tiers and shipping reach order payload`, async () => {
    let payload;
    const product = { slug: "tee", name: "Test tee", priceMxn: 359, productStatus: "active", unlimitedStock: true, stock: [{ size: "M", available: 20 }, { size: "G", available: 20 }] };
    const route = load(routeFile, {
      "@/src/lib/clip": {}, "@/src/lib/resend": {},
      "@/src/lib/requestSecurity": { guardRequest: async () => null },
      "@/src/lib/catalog": { getCatalogProducts: async () => [product] },
      "@/src/lib/wholesale": { getWholesaleDiscount: async items => wholesale.calculateWholesale(items, [rule()]) },
      "@/src/lib/coupons": { validateCoupon: async () => { throw new Error("unexpected coupon"); } },
      "@/src/lib/supabaseAdmin": { getSupabaseAdmin: () => ({ from: () => ({ insert: value => { payload = value; return { select: () => ({ single: async () => ({ data: null, error: { message: "STOP BEFORE PERSISTENCE" } }) }) }; } }) }) },
    });
    const response = await route.POST(new Request("http://localhost/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      customer: { email: "test@example.invalid", fullName: "Local Test", whatsapp: "2220000000", country: "México", street: "Calle prueba", exteriorNumber: "1", neighborhood: "Centro", city: "Puebla", state: "Puebla", postalCode: "72000", reference: "Puerta de prueba" },
      deliveryMethod: "national", discountMxn: 999999, items: [{ slug: "tee", size: "M", quantity: 3, priceMxn: 1 }, { slug: "tee", size: "G", quantity: 3, priceMxn: 1 }],
    }) }));
    assert.equal(response.status, 500); // Intentional persistence boundary: no orders/payments/emails.
    assert.equal(payload.subtotal_mxn, 2154);
    assert.equal(payload.discount_mxn, 180);
    assert.equal(payload.total_mxn, 1974);
    assert.equal(payload.shipping_mxn, 0);
    assert.equal(payload.discount_code, null);
    assert.equal(payload.items[0].wholesaleDiscountMxn, 90);
  });
}

test("admin wholesale denies every operation before reading or writing data", async () => {
  const route = load("app/api/admin/wholesale/route.ts", {
    "@/src/lib/adminApi": { requireAdminRequest: async () => ({ ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) }) },
    "@/src/lib/wholesale": { readWholesaleRules: () => { throw new Error("must not read"); } },
    "@/src/lib/catalog": { getCatalogProducts: () => { throw new Error("must not read"); } },
    "@/src/lib/supabaseAdmin": { getSupabaseAdmin: () => { throw new Error("must not write"); } },
  });
  for (const method of ["GET", "POST", "PATCH", "DELETE"]) assert.equal((await route[method](new Request("http://localhost/api/admin/wholesale", { method }))).status, 401);
});
test("wholesale storage distinguishes uninstalled table from service failure", async () => {
  function repository(code) { return load("src/lib/wholesale.ts", { "@/src/lib/supabaseAdmin": { getSupabaseAdmin: () => ({ from: () => ({ select: () => ({ order: async () => ({ data: null, error: { code } }) }) }) }) } }); }
  assert.deepEqual(await repository("PGRST205").readWholesaleRules(), { rules: [], configured: false });
  await assert.rejects(() => repository("NETWORK").readWholesaleRules());
});
test("admin wholesale validates and persists a rule through authenticated API", async () => {
  let saved;
  const route = load("app/api/admin/wholesale/route.ts", {
    "@/src/lib/adminApi": { requireAdminRequest: async () => ({ ok: true }), jsonError: (message, status = 400) => Response.json({ message }, { status }) },
    "@/src/lib/wholesale": {},
    "@/src/lib/catalog": { getCatalogProducts: async () => [{ slug: "tee", priceMxn: 359 }] },
    "@/src/lib/supabaseAdmin": { getSupabaseAdmin: () => ({ from: () => ({ insert: payload => { saved = payload; return { select: async () => ({ data: [{ id: "saved" }], error: null }) }; } }) }) },
  });
  const request = payload => new Request("http://localhost/api/admin/wholesale", { method: "POST", body: JSON.stringify(payload) });
  assert.equal((await route.POST(request(rule()))).status, 200);
  assert.equal(saved.min_quantity, 6);
  assert.equal(saved.discount_value, 30);
  saved = null;
  assert.equal((await route.POST(request(rule({ discount_value: 400 })))).status, 400);
  assert.equal(saved, null);
});
