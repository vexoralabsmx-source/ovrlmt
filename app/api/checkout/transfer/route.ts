import { NextResponse } from "next/server";
import {
  FREE_SHIPPING_MINIMUM,
  SHIPPING_COST,
  SIZES,
  isFreePersonalDeliveryPostalCode,
  type ProductSize,
} from "@/data/store";
import { getCatalogProducts } from "@/src/lib/catalog";
import { sendAdminPreorderNotification, sendCustomerPreorderEmail } from "@/src/lib/resend";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

type TransferBody = {
  customer?: Record<string, unknown>;
  items?: Array<{ slug?: unknown; size?: unknown; quantity?: unknown }>;
  couponCode?: unknown;
};

const clean = (value: unknown, max = 160) => typeof value === "string" ? value.trim().slice(0, max) : "";
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPhone = (value: string) => value.replace(/\D/g, "").length >= 10;

function orderCode() {
  return `OVR-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as TransferBody | null;
  const customer = {
    email: clean(body?.customer?.email, 180).toLowerCase(),
    fullName: clean(body?.customer?.fullName, 120),
    whatsapp: clean(body?.customer?.whatsapp, 30),
    city: clean(body?.customer?.city, 80),
    state: clean(body?.customer?.state, 80),
    postalCode: clean(body?.customer?.postalCode, 5).replace(/\D/g, ""),
    address: clean(body?.customer?.address, 220),
  };

  if (
    !validEmail(customer.email) ||
    !customer.fullName ||
    !validPhone(customer.whatsapp) ||
    !customer.city ||
    !customer.state ||
    !/^\d{5}$/.test(customer.postalCode) ||
    customer.address.length < 8
  ) {
    return NextResponse.json({ error: "Completa correctamente todos los datos obligatorios." }, { status: 400 });
  }
  if (!body?.items?.length || body.items.length > 20) {
    return NextResponse.json({ error: "El carrito no es válido." }, { status: 400 });
  }

  const catalog = await getCatalogProducts();
  const items = [];
  for (const requested of body.items) {
    const slug = clean(requested.slug, 100);
    const size = clean(requested.size, 4).toUpperCase() as ProductSize;
    const quantity = Number(requested.quantity);
    const product = catalog.find((candidate) => candidate.slug === slug);
    const stock = product?.stock.find((candidate) => candidate.size === size);
    if (
      !product ||
      product.productStatus !== "active" ||
      !SIZES.includes(size) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 20 ||
      !stock ||
      quantity > stock.available
    ) {
      return NextResponse.json({ error: "La disponibilidad cambió. Actualiza tu carrito." }, { status: 409 });
    }
    items.push({
      slug: product.slug,
      name: product.name,
      size,
      quantity,
      unitPriceMxn: Number(product.priceMxn),
      lineTotalMxn: Number(product.priceMxn) * quantity,
    });
  }

  const supabase = getSupabaseAdmin();
  const subtotalMxn = items.reduce((sum, item) => sum + item.lineTotalMxn, 0);
  const couponInput = clean(body.couponCode, 60).toUpperCase();
  let discountMxn = 0;
  let discountCode: string | null = null;
  if (couponInput) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("code,type,value,active,max_uses,used_count,minimum_subtotal_mxn,first_order_only,starts_at,ends_at")
      .eq("code", couponInput)
      .maybeSingle();
    const now = Date.now();
    const firstOrderCount = coupon?.first_order_only
      ? await supabase.from("preorders").select("id", { count: "exact", head: true }).eq("customer_email", customer.email).neq("status", "cancelled")
      : null;
    const couponValid = Boolean(
      coupon?.active &&
      (!coupon.max_uses || Number(coupon.used_count) < Number(coupon.max_uses)) &&
      subtotalMxn >= Number(coupon.minimum_subtotal_mxn || 0) &&
      (!coupon.starts_at || new Date(coupon.starts_at).getTime() <= now) &&
      (!coupon.ends_at || new Date(coupon.ends_at).getTime() >= now) &&
      (!coupon.first_order_only || Number(firstOrderCount?.count || 0) === 0),
    );
    if (!couponValid) return NextResponse.json({ error: "El cupón no es válido para esta compra." }, { status: 400 });
    discountCode = coupon!.code;
    discountMxn = coupon!.type === "percent"
      ? Math.round(subtotalMxn * Number(coupon!.value) / 100)
      : Math.min(subtotalMxn, Math.round(Number(coupon!.value)));
  }

  const afterDiscount = Math.max(0, subtotalMxn - discountMxn);
  const local = isFreePersonalDeliveryPostalCode(customer.postalCode);
  const shippingMxn = local || afterDiscount >= FREE_SHIPPING_MINIMUM ? 0 : SHIPPING_COST;
  const totalMxn = afterDiscount + shippingMxn;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const code = orderCode();
  const { data: order, error } = await supabase.from("preorders").insert({
    order_code: code,
    customer_name: customer.fullName,
    customer_email: customer.email,
    customer_whatsapp: customer.whatsapp,
    product_slug: items.map((item) => item.slug).join(","),
    product_name: items.map((item) => `${item.quantity}x ${item.name}`).join(", "),
    size: items.length === 1 ? items[0].size : "MULTI",
    quantity: totalQuantity,
    unit_price_mxn: items.length === 1 ? items[0].unitPriceMxn : Math.round(subtotalMxn / totalQuantity),
    subtotal_mxn: subtotalMxn,
    discount_code: discountCode,
    discount_mxn: discountMxn,
    shipping_mxn: shippingMxn,
    total_mxn: totalMxn,
    shipping_type: local ? "personal" : "national",
    address_state: customer.state,
    address_city: customer.city,
    address_line: customer.address,
    postal_code: customer.postalCode,
    status: "pending_payment",
    items,
    payment_provider: "manual",
    payment_method: "transfer",
    payment_status: "awaiting_proof",
    production_status: "received",
    source: "website_transfer",
  }).select("id").single();
  if (error || !order) return NextResponse.json({ error: "No pudimos guardar tu pedido." }, { status: 500 });

  const { error: reservationError } = await supabase.rpc("reserve_preorder_stock", {
    p_preorder_id: order.id,
    p_items: items,
    p_minutes: 180,
  });
  if (reservationError) {
    await supabase.from("preorders").delete().eq("id", order.id);
    return NextResponse.json({ error: "Una talla acaba de agotarse. Actualiza tu carrito." }, { status: 409 });
  }

  if (discountCode) {
    await supabase.from("coupons").update({ used_count: (await supabase.from("coupons").select("used_count").eq("code", discountCode).single()).data?.used_count + 1 }).eq("code", discountCode);
  }

  const emailOrder = {
    orderCode: code, customerName: customer.fullName, customerEmail: customer.email,
    customerWhatsapp: customer.whatsapp, productName: items.map((item) => item.name).join(", "),
    size: items.length === 1 ? items[0].size : "MULTI", quantity: totalQuantity, subtotalMxn,
    discountMxn, shippingMxn, totalMxn, discountCode, status: "pending_payment",
    addressCity: customer.city, addressState: customer.state,
    notes: "Transferencia pendiente de comprobante. La reserva vence en 3 horas.",
  };
  await Promise.allSettled([sendCustomerPreorderEmail(emailOrder), sendAdminPreorderNotification(emailOrder)]);
  await supabase.from("checkout_drafts").update({ recovered_at: new Date().toISOString() }).eq("customer_email", customer.email);

  return NextResponse.json({ ok: true, orderCode: code, totalMxn, shippingMxn });
}
