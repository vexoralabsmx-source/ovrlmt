import { NextResponse } from "next/server";
import { SIZES, FREE_SHIPPING_MINIMUM, SHIPPING_COST, isFreePersonalDeliveryPostalCode, type ProductSize } from "@/data/store";
import { createClipCheckout, ClipApiError } from "@/src/lib/clip";
import { getCatalogProducts, isUnlimitedStockProductSlug } from "@/src/lib/catalog";
import { validateCoupon } from "@/src/lib/coupons";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { guardRequest } from "@/src/lib/requestSecurity";

export const runtime = "nodejs";

type CheckoutBody = {
  customer?: {
    email?: unknown;
    fullName?: unknown;
    company?: unknown;
    whatsapp?: unknown;
    country?: unknown;
    street?: unknown;
    exteriorNumber?: unknown;
    interiorNumber?: unknown;
    neighborhood?: unknown;
    city?: unknown;
    state?: unknown;
    postalCode?: unknown;
    reference?: unknown;
    address?: unknown;
  };
  items?: Array<{ slug?: unknown; size?: unknown; quantity?: unknown }>;
  couponCode?: unknown;
  deliveryMethod?: unknown;
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const cleanText = (value: unknown, max = 160) => typeof value === "string" ? value.trim().slice(0, max) : "";
const isMissingColumnError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: unknown }).message || "") : "";
  const details = "details" in error ? String((error as { details?: unknown }).details || "") : "";
  return /customer_company|address_country|address_street|address_exterior_number|address_interior_number|address_neighborhood|address_reference/i.test(`${message} ${details}`);
};

function withoutExtendedAddressColumns<T extends Record<string, unknown>>(payload: T) {
  const {
    customer_company,
    address_country,
    address_street,
    address_exterior_number,
    address_interior_number,
    address_neighborhood,
    address_reference,
    ...legacyPayload
  } = payload;
  void customer_company;
  void address_country;
  void address_street;
  void address_exterior_number;
  void address_interior_number;
  void address_neighborhood;
  void address_reference;
  return legacyPayload;
}

function createOrderCode() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `OVR-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function resolveBaseUrl(request: Request) {
  const configured = process.env.APP_BASE_URL?.trim().replace(/\/+$/, "");
  return configured || new URL(request.url).origin;
}

export async function POST(request: Request) {
  const blocked = await guardRequest(request, { bucket: "checkout-clip", limit: 8, windowMs: 10 * 60_000, maxBodyBytes: 131_072, requireJson: true });
  if (blocked) return blocked;
  let body: CheckoutBody;
  try {
    body = await request.json() as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const customer = {
    email: cleanText(body.customer?.email, 180).toLowerCase(),
    fullName: cleanText(body.customer?.fullName, 120),
    company: cleanText(body.customer?.company, 80),
    whatsapp: cleanText(body.customer?.whatsapp, 30),
    country: cleanText(body.customer?.country, 60) || "México",
    street: cleanText(body.customer?.street, 120),
    exteriorNumber: cleanText(body.customer?.exteriorNumber, 20),
    interiorNumber: cleanText(body.customer?.interiorNumber, 20),
    neighborhood: cleanText(body.customer?.neighborhood, 100),
    city: cleanText(body.customer?.city, 80),
    state: cleanText(body.customer?.state, 80),
    postalCode: cleanText(body.customer?.postalCode, 5).replace(/\D/g, ""),
    reference: cleanText(body.customer?.reference, 120),
    address: cleanText(body.customer?.address, 280),
  };
  if (!customer.address) {
    customer.address = [
      customer.street,
      customer.exteriorNumber ? `No. ext. ${customer.exteriorNumber}` : "",
      customer.interiorNumber ? `No. int. ${customer.interiorNumber}` : "",
      customer.neighborhood ? `Col. ${customer.neighborhood}` : "",
      customer.reference ? `Ref. ${customer.reference}` : "",
    ].filter(Boolean).join(", ");
  }

  if (
    !isEmail(customer.email) ||
    !customer.fullName ||
    customer.whatsapp.replace(/\D/g, "").length < 10 ||
    !customer.country ||
    customer.street.length < 3 ||
    !customer.exteriorNumber ||
    !customer.neighborhood ||
    !customer.city ||
    !customer.state ||
    !/^\d{5}$/.test(customer.postalCode) ||
    customer.reference.length < 4 ||
    customer.address.length < 8
  ) {
    return NextResponse.json({ error: "Revisa tus datos de contacto y entrega." }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
    return NextResponse.json({ error: "El carrito no es válido." }, { status: 400 });
  }

  const catalog = await getCatalogProducts();
  const validatedItems = [];

  for (const requested of body.items) {
    const slug = cleanText(requested.slug, 100);
    const size = cleanText(requested.size, 4) as ProductSize;
    const quantity = Number(requested.quantity);
    const product = catalog.find((item) => item.slug === slug);
    const stock = product?.stock.find((item) => item.size === size);

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
      return NextResponse.json(
        { error: `La disponibilidad de ${product?.name || "una pieza"} cambió. Actualiza tu carrito.` },
        { status: 409 },
      );
    }

    validatedItems.push({
      slug: product.slug,
      name: product.name,
      size,
      quantity,
      unitPriceMxn: Number(product.priceMxn),
      lineTotalMxn: Number(product.priceMxn) * quantity,
    });
  }

  const subtotalMxn = validatedItems.reduce((sum, item) => sum + item.lineTotalMxn, 0);
  const couponInput = cleanText(body.couponCode, 60).toUpperCase();
  let coupon: { code: string; discountMxn: number } | null = null;
  if (couponInput) {
    try {
      coupon = await validateCoupon(couponInput, subtotalMxn, customer.email);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Cupón inválido." }, { status: 400 });
    }
  }
  const afterDiscount = Math.max(0, subtotalMxn - (coupon?.discountMxn || 0));
  const deliveryMethodInput = cleanText(body.deliveryMethod, 20).toLowerCase();
  if (deliveryMethodInput && deliveryMethodInput !== "personal" && deliveryMethodInput !== "national") {
    return NextResponse.json({ error: "El método de entrega no es válido." }, { status: 400 });
  }
  const personalAvailable = isFreePersonalDeliveryPostalCode(customer.postalCode);
  if (deliveryMethodInput === "personal" && !personalAvailable) {
    return NextResponse.json({ error: "La entrega personal no está disponible para este código postal." }, { status: 400 });
  }
  const personalDelivery = deliveryMethodInput === "personal" || (!deliveryMethodInput && personalAvailable);
  const shippingMxn = personalDelivery || afterDiscount >= FREE_SHIPPING_MINIMUM ? 0 : SHIPPING_COST;
  const totalMxn = afterDiscount + shippingMxn;
  const quantity = validatedItems.reduce((sum, item) => sum + item.quantity, 0);
  const orderCode = createOrderCode();
  const productName = validatedItems.map((item) => `${item.quantity}x ${item.name}`).join(", ");
  const baseUrl = resolveBaseUrl(request);
  const supabase = getSupabaseAdmin();

  const orderPayload = {
    order_code: orderCode,
    customer_name: customer.fullName,
    customer_email: customer.email,
    customer_whatsapp: customer.whatsapp,
    customer_company: customer.company || null,
    product_slug: validatedItems.map((item) => item.slug).join(","),
    product_name: productName,
    size: validatedItems.length === 1 ? validatedItems[0].size : "MULTI",
    quantity,
    unit_price_mxn: validatedItems.length === 1 ? validatedItems[0].unitPriceMxn : Math.round(subtotalMxn / quantity),
    subtotal_mxn: subtotalMxn,
    discount_code: coupon?.code || null,
    discount_mxn: coupon?.discountMxn || 0,
    shipping_mxn: shippingMxn,
    total_mxn: totalMxn,
    shipping_type: personalDelivery ? "personal" : "national",
    address_state: customer.state,
    address_city: customer.city,
    address_line: customer.address,
    postal_code: customer.postalCode,
    address_country: customer.country,
    address_street: customer.street,
    address_exterior_number: customer.exteriorNumber,
    address_interior_number: customer.interiorNumber || null,
    address_neighborhood: customer.neighborhood,
    address_reference: customer.reference,
    status: "pending_payment",
    items: validatedItems,
    payment_provider: "clip",
    payment_method: "card",
    payment_status: "creating",
    source: "website_clip",
  };

  let insertResult = await supabase
    .from("preorders")
    .insert(orderPayload)
    .select("id")
    .single();

  if (insertResult.error && isMissingColumnError(insertResult.error)) {
    insertResult = await supabase
      .from("preorders")
      .insert(withoutExtendedAddressColumns(orderPayload))
      .select("id")
      .single();
  }

  const { data: order, error: orderError } = insertResult;

  if (orderError || !order) {
    return NextResponse.json({ error: "No pudimos preparar tu orden. Intenta de nuevo." }, { status: 500 });
  }

  try {
    await supabase.rpc("release_expired_stock_reservations");
    const limitedStockItems = validatedItems.filter((item) => !isUnlimitedStockProductSlug(item.slug));
    if (limitedStockItems.length > 0) {
      const { error: reservationError } = await supabase.rpc("reserve_preorder_stock", {
        p_preorder_id: order.id,
        p_items: limitedStockItems,
        p_minutes: 30,
      });
      if (reservationError) {
        await supabase.from("preorders").delete().eq("id", order.id);
        return NextResponse.json(
          { error: "Una talla se agotó mientras preparábamos tu pago. Actualiza el carrito." },
          { status: 409 },
        );
      }
    }

    const configuredWebhook = process.env.CLIP_WEBHOOK_URL?.trim();
    const webhookUrl = configuredWebhook || (baseUrl.startsWith("https://") ? `${baseUrl}/api/clip/webhook` : undefined);
    const checkout = await createClipCheckout({
      amount: Number(totalMxn.toFixed(2)),
      currency: "MXN",
      purchase_description: `OVRLMT ${orderCode} - ${quantity} pieza${quantity === 1 ? "" : "s"}`,
      redirection_url: {
        success: `${baseUrl}/cart?clip=success`,
        error: `${baseUrl}/cart?clip=error`,
        default: `${baseUrl}/cart`,
      },
      ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
      override_settings: {
        locale: "es-MX",
        enable_tip: false,
        enable_contact_information: true,
      },
      custom_payment_options: {
        payment_method_types: ["debit", "credit"],
        card_brands: ["visa", "mastercard", "amex"],
        enable_international_cards: false,
      },
      metadata: {
        external_reference: orderCode,
        customer_info: {
          name: customer.fullName,
          email: customer.email,
          phone: customer.whatsapp,
        },
        shipping_address: {
          street: customer.street,
          exterior_number: customer.exteriorNumber,
          interior_number: customer.interiorNumber,
          neighborhood: customer.neighborhood,
          reference: customer.reference,
          city: customer.city,
          state: customer.state,
          postal_code: customer.postalCode,
          country: customer.country,
        },
      },
    });

    const { error: updateError } = await supabase
      .from("preorders")
      .update({
        payment_request_id: checkout.payment_request_id,
        payment_url: checkout.payment_request_url,
        payment_status: checkout.status.toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) throw new Error("No pudimos vincular el pago con tu orden.");

    return NextResponse.json({
      ok: true,
      orderCode,
      totalMxn,
      paymentRequestId: checkout.payment_request_id,
      paymentUrl: checkout.payment_request_url,
    });
  } catch (error) {
    await supabase.rpc("release_preorder_stock", { p_preorder_id: order.id });
    await supabase
      .from("preorders")
      .update({ payment_status: "checkout_error", updated_at: new Date().toISOString() })
      .eq("id", order.id);

    const status = error instanceof ClipApiError ? 502 : 503;
    const detail = process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: "Clip no pudo iniciar el pago. Intenta nuevamente.", ...(detail ? { detail } : {}) },
      { status },
    );
  }
}
