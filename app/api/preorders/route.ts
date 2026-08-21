import { NextResponse } from "next/server";
import { FREE_SHIPPING_MINIMUM, SHIPPING_COST } from "@/data/store";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { sendAdminPreorderNotification, sendCustomerPreorderEmail } from "@/src/lib/resend";
import { generateWhatsappMessage } from "@/src/lib/whatsapp";
import { guardRequest } from "@/src/lib/requestSecurity";
import { getCatalogProducts } from "@/src/lib/catalog";

type ErrorCode =
  | "missing_env_vars"
  | "invalid_payload"
  | "missing_required_email"
  | "supabase_insert_failed"
  | "coupon_validation_failed"
  | "resend_customer_email_failed"
  | "resend_admin_email_failed"
  | "unknown_error";

type PreorderRequest = {
  customerName?: string;
  customerEmail?: string;
  customerWhatsapp?: string;
  customerCompany?: string;
  productSlug?: string;
  productName?: string;
  size?: string;
  quantity?: number;
  unitPriceMxn?: number;
  discountCode?: string;
  addressCountry?: string;
  addressStreet?: string;
  addressExteriorNumber?: string;
  addressInteriorNumber?: string;
  addressNeighborhood?: string;
  addressState?: string;
  addressCity?: string;
  postalCode?: string;
  addressReference?: string;
  addressLine?: string;
  shippingType?: string;
  notes?: string;
};

const VALID_SIZES = new Set(["CH", "M", "G", "XG", "S", "L", "XL", "MULTI"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

class PreorderError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ErrorCode, message: string, status = 400, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function clean(value: unknown, maxLength = 280) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

function jsonError(code: ErrorCode, message: string, status = 400, details?: unknown) {
  const body: { ok: false; code: ErrorCode; message: string; details?: unknown } = { ok: false, code, message };
  if (process.env.NODE_ENV !== "production" && details) body.details = details;
  return NextResponse.json(body, { status });
}

function assertEnv() {
  const missing = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "ADMIN_NOTIFICATION_EMAIL",
  ].filter((key) => !process.env[key]);

  if (missing.length) {
    throw new PreorderError("missing_env_vars", "Faltan variables de entorno del servidor.", 500, { missing });
  }
}

function createOrderCode() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `OVR-${date}-${suffix}`;
}

async function resolveCoupon(discountCode: string, subtotalMxn: number) {
  if (!discountCode) return { discountCode: null as string | null, discountMxn: 0 };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("coupons")
    .select("code,type,value,active,max_uses,used_count")
    .eq("code", discountCode.toUpperCase())
    .maybeSingle();

  if (error) {
    throw new PreorderError("coupon_validation_failed", "No pudimos validar el cupón.", 500, error.message);
  }

  if (!data || !data.active || (data.max_uses !== null && data.used_count >= data.max_uses)) {
    throw new PreorderError("coupon_validation_failed", "No encontramos ese cupón.", 400);
  }

  const discountMxn = data.type === "percent"
    ? Math.round(subtotalMxn * (Number(data.value) / 100))
    : Math.min(subtotalMxn, Math.round(Number(data.value)));

  return { discountCode: data.code as string, discountMxn };
}

export async function POST(request: Request) {
  const blocked = await guardRequest(request, { bucket: "preorders", limit: 8, windowMs: 10 * 60_000, maxBodyBytes: 65_536, requireJson: true });
  if (blocked) return blocked;
  try {
    assertEnv();

    const body = (await request.json()) as PreorderRequest;
    const customerName = clean(body.customerName, 120);
    const customerEmail = clean(body.customerEmail, 160).toLowerCase();
    const customerWhatsapp = clean(body.customerWhatsapp, 40);
    const customerCompany = clean(body.customerCompany, 80);
    const productSlug = clean(body.productSlug, 120);
    const size = clean(body.size, 8).toUpperCase();
    const quantity = Math.max(1, Math.min(20, Number(body.quantity) || 0));
    const discountCodeInput = clean(body.discountCode, 60).toUpperCase();
    const addressCountry = clean(body.addressCountry, 60) || "México";
    const addressStreet = clean(body.addressStreet, 120);
    const addressExteriorNumber = clean(body.addressExteriorNumber, 20);
    const addressInteriorNumber = clean(body.addressInteriorNumber, 20);
    const addressNeighborhood = clean(body.addressNeighborhood, 100);
    const addressState = clean(body.addressState, 80);
    const addressCity = clean(body.addressCity, 80);
    const postalCode = clean(body.postalCode, 5).replace(/\D/g, "");
    const addressReference = clean(body.addressReference, 120);
    const addressLine = clean(body.addressLine, 280) || [
      addressStreet,
      addressExteriorNumber ? `No. ext. ${addressExteriorNumber}` : "",
      addressInteriorNumber ? `No. int. ${addressInteriorNumber}` : "",
      addressNeighborhood ? `Col. ${addressNeighborhood}` : "",
      addressReference ? `Ref. ${addressReference}` : "",
    ].filter(Boolean).join(", ");
    const shippingType = clean(body.shippingType, 80) || "external";
    const notes = clean(body.notes, 500);

    if (!customerName) throw new PreorderError("invalid_payload", "Falta tu nombre.");
    if (!customerEmail) throw new PreorderError("missing_required_email", "Agrega tu correo para recibir la confirmación de tu pedido.");
    if (!EMAIL_RE.test(customerEmail)) throw new PreorderError("invalid_payload", "Escribe un correo electrónico válido.");
    if (!customerWhatsapp) throw new PreorderError("invalid_payload", "Agrega tu WhatsApp para poder dar seguimiento.");
    if (customerWhatsapp.replace(/\D/g, "").length < 10) throw new PreorderError("invalid_payload", "Agrega un teléfono válido.");
    if (!productSlug) throw new PreorderError("invalid_payload", "Selecciona un producto.");
    if (!VALID_SIZES.has(size)) throw new PreorderError("invalid_payload", "Selecciona una talla.");
    if (!quantity) throw new PreorderError("invalid_payload", "Selecciona una cantidad válida.");
    if (!addressCountry) throw new PreorderError("invalid_payload", "Agrega tu país.");
    if (addressStreet.length < 3) throw new PreorderError("invalid_payload", "Agrega tu calle.");
    if (!addressExteriorNumber) throw new PreorderError("invalid_payload", "Agrega tu número exterior.");
    if (!addressNeighborhood) throw new PreorderError("invalid_payload", "Agrega tu colonia.");
    if (!addressCity) throw new PreorderError("invalid_payload", "Agrega tu ciudad.");
    if (!addressState) throw new PreorderError("invalid_payload", "Agrega tu estado.");
    if (!/^\d{5}$/.test(postalCode)) throw new PreorderError("invalid_payload", "Agrega un código postal válido.");
    if (addressReference.length < 4) throw new PreorderError("invalid_payload", "Agrega una referencia de entrega.");

    const catalog = await getCatalogProducts();
    const product = catalog.find((item) => item.slug === productSlug);
    if (!product || product.productStatus !== "active") throw new PreorderError("invalid_payload", "Ese producto no está disponible.");
    const sizeStock = product.stock.find((item) => item.size === size);
    if (!product.unlimitedStock && (!sizeStock || sizeStock.available < quantity)) {
      throw new PreorderError("invalid_payload", "No hay suficiente disponibilidad en esa talla.");
    }
    const productName = `${product.name} ${product.piece}`;
    const unitPriceMxn = product.priceMxn;

    const subtotalMxn = quantity * unitPriceMxn;
    const coupon = await resolveCoupon(discountCodeInput, subtotalMxn);
    const afterDiscount = Math.max(0, subtotalMxn - coupon.discountMxn);
    const shippingMxn = afterDiscount >= FREE_SHIPPING_MINIMUM ? 0 : SHIPPING_COST;
    const totalMxn = afterDiscount + shippingMxn;
    const orderCode = createOrderCode();
    const status = "pending_payment";

    const order = {
      order_code: orderCode,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_whatsapp: customerWhatsapp,
      customer_company: customerCompany || null,
      product_slug: productSlug,
      product_name: productName,
      size,
      quantity,
      unit_price_mxn: unitPriceMxn,
      subtotal_mxn: subtotalMxn,
      discount_code: coupon.discountCode,
      discount_mxn: coupon.discountMxn,
      shipping_mxn: shippingMxn,
      total_mxn: totalMxn,
      shipping_type: shippingType,
      address_state: addressState,
      address_city: addressCity,
      address_line: addressLine,
      postal_code: postalCode,
      address_country: addressCountry,
      address_street: addressStreet,
      address_exterior_number: addressExteriorNumber,
      address_interior_number: addressInteriorNumber || null,
      address_neighborhood: addressNeighborhood,
      address_reference: addressReference,
      status,
      notes: notes || null,
      source: "website",
    };

    const supabase = getSupabaseAdmin();
    let insertResult = await supabase.from("preorders").insert(order);
    if (insertResult.error && isMissingColumnError(insertResult.error)) {
      insertResult = await supabase.from("preorders").insert(withoutExtendedAddressColumns(order));
    }
    const { error: insertError } = insertResult;
    if (insertError) {
      throw new PreorderError("supabase_insert_failed", "No pudimos guardar tu pedido. Revisa la conexión o configuración de Supabase.", 500, insertError.message);
    }

    if (coupon.discountCode) {
      const { data: currentCoupon, error: couponReadError } = await supabase
        .from("coupons")
        .select("used_count")
        .eq("code", coupon.discountCode)
        .single();

      if (!couponReadError) {
        await supabase
          .from("coupons")
          .update({ used_count: Number(currentCoupon?.used_count || 0) + 1 })
          .eq("code", coupon.discountCode);
      }
    }

    const emailOrder = {
      orderCode,
      customerName,
      customerEmail,
      customerWhatsapp,
      customerCompany: customerCompany || null,
      productName,
      size,
      quantity,
      subtotalMxn,
      discountMxn: coupon.discountMxn,
      shippingMxn,
      totalMxn,
      discountCode: coupon.discountCode,
      status,
      addressCity,
      addressState,
      addressLine,
      addressCountry,
      addressStreet,
      addressExteriorNumber,
      addressInteriorNumber: addressInteriorNumber || null,
      addressNeighborhood,
      addressReference,
      notes: notes || null,
    };

    const customerEmailResult = await sendCustomerPreorderEmail(emailOrder);
    if (!customerEmailResult.ok) {
      console.error("RESEND_CUSTOMER_EMAIL_FAILED", {
        orderCode,
        customerEmail,
        errorMessage: customerEmailResult.errorMessage,
      });
    }

    const adminEmailResult = await sendAdminPreorderNotification(emailOrder);
    if (!adminEmailResult.ok) {
      console.error("RESEND_ADMIN_EMAIL_FAILED", {
        orderCode,
        adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL,
        errorMessage: adminEmailResult.errorMessage,
      });
    }

    const emailSent = customerEmailResult.ok;
    const adminEmailSent = adminEmailResult.ok;
    const emailWarning = !emailSent || !adminEmailSent;

    const whatsappMessage = generateWhatsappMessage({
      orderCode,
      productName,
      size,
      quantity,
      totalMxn,
      customerName,
      customerEmail,
    });

    return NextResponse.json({ ok: true, orderCode, totalMxn, customerEmail, emailSent, adminEmailSent, whatsappMessage, emailWarning });
  } catch (error) {
    if (error instanceof PreorderError) {
      console.error("preorders_api_error", { code: error.code, message: error.message, details: error.details });
      return jsonError(error.code, error.message, error.status, error.details);
    }

    console.error("preorders_api_error", { code: "unknown_error", error });
    return jsonError("unknown_error", "No pudimos registrar tu pedido. Intenta de nuevo o escríbenos por WhatsApp.", 500);
  }
}
