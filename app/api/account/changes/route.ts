import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/src/lib/authServer";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

export async function POST(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const email = auth.user.email?.toLowerCase();
  const body = await request.json() as { preorderId?: unknown; requestedSize?: unknown; reason?: unknown };
  const preorderId = typeof body.preorderId === "string" ? body.preorderId : "";
  const requestedSize = typeof body.requestedSize === "string" ? body.requestedSize.toUpperCase() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 600) : "";
  if (!preorderId || !["CH", "M", "G", "XG"].includes(requestedSize) || reason.length < 5) {
    return NextResponse.json({ error: "Selecciona talla y explica brevemente el cambio." }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase.from("preorders").select("id,status").eq("id", preorderId).eq("customer_email", email).maybeSingle();
  if (!order || !["payment_validated", "in_production", "ready_to_ship", "delivered"].includes(order.status)) {
    return NextResponse.json({ error: "Este pedido no admite una solicitud de cambio." }, { status: 403 });
  }
  const { error } = await supabase.from("change_requests").insert({
    preorder_id: preorderId,
    customer_email: email,
    request_type: "size_change",
    requested_size: requestedSize,
    reason,
  });
  if (error) return NextResponse.json({ error: "No pudimos registrar tu solicitud." }, { status: 500 });
  return NextResponse.json({ ok: true, message: "Solicitud enviada. Te contactaremos para confirmar disponibilidad." });
}
