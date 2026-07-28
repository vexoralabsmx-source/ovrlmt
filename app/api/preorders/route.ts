import { NextResponse } from "next/server";
import { FREE_SHIPPING_MINIMUM, SHIPPING_COST } from "@/data/store";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { sendAdminPreorderNotification, sendCustomerPreorderEmail } from "@/src/lib/resend";
import { generateWhatsappMessage } from "@/src/lib/whatsapp";

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
  productSlug?: string;
  productName?: string;
  size?: string;
  quantity?: number;
  unitPriceMxn?: number;
  discountCode?: string;
  addressState?: string;
  addressCity?: string;
  shippingType?: string;
  notes?: string;
};

const VALID_SIZES = new Set(["CH", "M", "G", "XG", "S", "L", "XL", "MULTI"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  try {
    assertEnv();

    const body = (await request.json()) as PreorderRequest;
    const customerName = clean(body.customerName, 120);
    const customerEmail = clean(body.customerEmail, 160).toLowerCase();
    const customerWhatsapp = clean(body.customerWhatsapp, 40);
    const productSlug = clean(body.productSlug, 120);
    const productName = clean(body.productName, 160);
    const size = clean(body.size, 8).toUpperCase();
    const quantity = Math.max(1, Math.min(20, Number(body.quantity) || 0));
    const unitPriceMxn = Math.max(0, Math.round(Number(body.unitPriceMxn) || 0));
    const discountCodeInput = clean(body.discountCode, 60).toUpperCase();
    const addressState = clean(body.addressState, 80);
    const addressCity = clean(body.addressCity, 80);
    const shippingType = clean(body.shippingType, 80) || "external";
    const notes = clean(body.notes, 500);

    if (!customerName) throw new PreorderError("invalid_payload", "Falta tu nombre.");
    if (!customerEmail) throw new PreorderError("missing_required_email", "Agrega tu correo para recibir la confirmación de tu pedido.");
    if (!EMAIL_RE.test(customerEmail)) throw new PreorderError("invalid_payload", "Escribe un correo electrónico válido.");
    if (!customerWhatsapp) throw new PreorderError("invalid_payload", "Agrega tu WhatsApp para poder dar seguimiento.");
    if (!productSlug || !productName) throw new PreorderError("invalid_payload", "Selecciona un producto.");
    if (!VALID_SIZES.has(size)) throw new PreorderError("invalid_payload", "Selecciona una talla.");
    if (!quantity) throw new PreorderError("invalid_payload", "Selecciona una cantidad válida.");
    if (!unitPriceMxn) throw new PreorderError("invalid_payload", "No pudimos validar el precio.");
    if (!addressCity) throw new PreorderError("invalid_payload", "Agrega tu ciudad.");
    if (!addressState) throw new PreorderError("invalid_payload", "Agrega tu estado.");

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
      status,
      notes: notes || null,
      source: "website",
    };

    const supabase = getSupabaseAdmin();
    const { error: insertError } = await supabase.from("preorders").insert(order);
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
