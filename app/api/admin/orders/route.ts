import { NextResponse } from "next/server";
import { getUserFromRequest, isAdminEmail } from "@/src/lib/authServer";
import { ORDER_STATUSES, PRODUCTION_STATUSES } from "@/src/lib/orderStatus";
import { sendOrderStatusEmail } from "@/src/lib/resend";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

const VALID_STATUSES = new Set(ORDER_STATUSES.map((status) => status.value));
const VALID_PRODUCTION_STATUSES = new Set(PRODUCTION_STATUSES.map((status) => status.value));

async function requireAdmin(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return auth;
  if (!isAdminEmail(auth.user.email)) return { ok: false as const, status: 403, message: "No tienes acceso admin." };
  return auth;
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  const fullQuery = await supabase
    .from("preorders")
    .select("id,order_code,customer_name,customer_email,customer_whatsapp,customer_company,product_name,size,items,quantity,subtotal_mxn,discount_code,discount_mxn,shipping_mxn,total_mxn,status,production_status,refund_status,refund_reference,address_country,address_street,address_exterior_number,address_interior_number,address_neighborhood,address_reference,address_city,address_state,address_line,postal_code,notes,payment_provider,payment_method,payment_status,payment_receipt_no,paid_at,shipping_status,tracking_id,tracking_link,shipping_provider,shipping_cost_real,created_at,updated_at,shipments(id,provider,provider_id,provider_service_id,service_name,rate_uuid,trx_id,guide_id,tracking_id,tracking_link,shipping_cost,status,created_at,updated_at)")
    .order("created_at", { ascending: false })
    .limit(100);

  const fallbackQuery = fullQuery.error ? await supabase
    .from("preorders")
    .select("id,order_code,customer_name,customer_email,customer_whatsapp,customer_company,product_name,size,items,quantity,subtotal_mxn,discount_code,discount_mxn,shipping_mxn,total_mxn,status,production_status,refund_status,refund_reference,address_country,address_street,address_exterior_number,address_interior_number,address_neighborhood,address_reference,address_city,address_state,address_line,postal_code,notes,payment_provider,payment_method,payment_status,payment_receipt_no,paid_at,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100) : null;

  const legacyFallbackQuery = fallbackQuery?.error ? await supabase
    .from("preorders")
    .select("id,order_code,customer_name,customer_email,customer_whatsapp,product_name,size,items,quantity,subtotal_mxn,discount_code,discount_mxn,shipping_mxn,total_mxn,status,address_city,address_state,address_line,postal_code,notes,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100) : null;

  const data = legacyFallbackQuery?.data || fallbackQuery?.data || fullQuery.data;
  const error = legacyFallbackQuery?.error || (legacyFallbackQuery ? null : fallbackQuery?.error || (fallbackQuery ? null : fullQuery.error));

  if (error) {
    return NextResponse.json({ ok: false, message: "No pudimos cargar pedidos." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orders: data });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

  const body = await request.json() as { id?: string; status?: string; productionStatus?: string; refundStatus?: string; refundReference?: string; notes?: string; sendEmail?: boolean };
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 800) : "";
  const productionStatus = typeof body.productionStatus === "string" ? body.productionStatus : "received";
  const refundStatus = ["none", "requested", "processing", "refunded", "rejected"].includes(body.refundStatus || "") ? body.refundStatus : "none";
  const refundReference = typeof body.refundReference === "string" ? body.refundReference.trim().slice(0, 120) : "";

  if (!id || !VALID_STATUSES.has(status as never) || !VALID_PRODUCTION_STATUSES.has(productionStatus as never)) {
    return NextResponse.json({ ok: false, message: "Datos invalidos." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("preorders")
    .update({ status, production_status: productionStatus, refund_status: refundStatus, refund_reference: refundReference || null, refunded_at: refundStatus === "refunded" ? new Date().toISOString() : null, notes: notes || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("order_code,customer_name,customer_email,customer_whatsapp,customer_company,product_name,size,quantity,subtotal_mxn,discount_mxn,shipping_mxn,total_mxn,discount_code,status,address_city,address_state,address_line,address_country,address_street,address_exterior_number,address_interior_number,address_neighborhood,address_reference,notes")
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, message: "No pudimos actualizar el pedido." }, { status: 500 });
  }

  if (status === "payment_validated") await supabase.rpc("confirm_preorder_stock", { p_preorder_id: id });
  if (status === "cancelled") await supabase.rpc("release_preorder_stock", { p_preorder_id: id });

  let emailSent = false;
  let emailError: string | undefined;
  if (body.sendEmail) {
    const result = await sendOrderStatusEmail({
      orderCode: data.order_code,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerWhatsapp: data.customer_whatsapp,
      customerCompany: data.customer_company,
      productName: data.product_name,
      size: data.size,
      quantity: Number(data.quantity),
      subtotalMxn: Number(data.subtotal_mxn),
      discountMxn: Number(data.discount_mxn || 0),
      shippingMxn: Number(data.shipping_mxn || 0),
      totalMxn: Number(data.total_mxn),
      discountCode: data.discount_code,
      status: data.status,
      addressCity: data.address_city,
      addressState: data.address_state,
      addressLine: data.address_line,
      addressCountry: data.address_country,
      addressStreet: data.address_street,
      addressExteriorNumber: data.address_exterior_number,
      addressInteriorNumber: data.address_interior_number,
      addressNeighborhood: data.address_neighborhood,
      addressReference: data.address_reference,
      notes: data.notes,
    });
    emailSent = result.ok;
    emailError = result.errorMessage;
  }

  return NextResponse.json({ ok: true, order: data, emailSent, emailError });
}
