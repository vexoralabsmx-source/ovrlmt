import { NextResponse } from "next/server";
import { getUserFromRequest, isAdminEmail } from "@/src/lib/authServer";
import { ORDER_STATUSES } from "@/src/lib/orderStatus";
import { sendOrderStatusEmail } from "@/src/lib/resend";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

const VALID_STATUSES = new Set(ORDER_STATUSES.map((status) => status.value));

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
    .select("id,order_code,customer_name,customer_email,customer_whatsapp,product_name,size,quantity,subtotal_mxn,discount_mxn,shipping_mxn,total_mxn,status,address_city,address_state,notes,payment_provider,payment_method,payment_status,payment_receipt_no,paid_at,shipping_status,tracking_id,tracking_link,shipping_provider,shipping_cost_real,created_at,updated_at,shipments(id,provider,provider_id,provider_service_id,service_name,rate_uuid,trx_id,guide_id,tracking_id,tracking_link,shipping_cost,status,created_at,updated_at)")
    .order("created_at", { ascending: false })
    .limit(100);

  const fallbackQuery = fullQuery.error ? await supabase
    .from("preorders")
    .select("id,order_code,customer_name,customer_email,customer_whatsapp,product_name,size,quantity,subtotal_mxn,discount_mxn,shipping_mxn,total_mxn,status,address_city,address_state,notes,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100) : null;

  const data = fallbackQuery?.data || fullQuery.data;
  const error = fallbackQuery?.error || (fallbackQuery ? null : fullQuery.error);

  if (error) {
    return NextResponse.json({ ok: false, message: "No pudimos cargar pedidos." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orders: data });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

  const body = await request.json() as { id?: string; status?: string; notes?: string; sendEmail?: boolean };
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 800) : "";

  if (!id || !VALID_STATUSES.has(status as never)) {
    return NextResponse.json({ ok: false, message: "Datos invalidos." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("preorders")
    .update({ status, notes: notes || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("order_code,customer_name,customer_email,customer_whatsapp,product_name,size,quantity,subtotal_mxn,discount_mxn,shipping_mxn,total_mxn,discount_code,status,address_city,address_state,notes")
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, message: "No pudimos actualizar el pedido." }, { status: 500 });
  }

  let emailSent = false;
  let emailError: string | undefined;
  if (body.sendEmail) {
    const result = await sendOrderStatusEmail({
      orderCode: data.order_code,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerWhatsapp: data.customer_whatsapp,
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
      notes: data.notes,
    });
    emailSent = result.ok;
    emailError = result.errorMessage;
  }

  return NextResponse.json({ ok: true, order: data, emailSent, emailError });
}
