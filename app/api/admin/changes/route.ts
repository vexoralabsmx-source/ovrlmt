import { NextResponse } from "next/server";
import { getUserFromRequest, isAdminEmail } from "@/src/lib/authServer";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

async function requireAdmin(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return auth;
  if (!isAdminEmail(auth.user.email)) return { ok: false as const, status: 403, message: "Sin acceso." };
  return auth;
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { data, error } = await getSupabaseAdmin()
    .from("change_requests")
    .select("id,preorder_id,customer_email,request_type,requested_size,reason,status,admin_notes,created_at,preorders(order_code,customer_name,product_name,size)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "No pudimos cargar las solicitudes." }, { status: 500 });
  return NextResponse.json({ ok: true, requests: data || [] });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await request.json() as { id?: unknown; status?: unknown; adminNotes?: unknown };
  const id = typeof body.id === "string" ? body.id : "";
  const status = ["pending", "approved", "rejected", "completed"].includes(String(body.status)) ? String(body.status) : "";
  const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim().slice(0, 800) : "";
  if (!id || !status) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const { error } = await getSupabaseAdmin()
    .from("change_requests")
    .update({ status, admin_notes: adminNotes || null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "No pudimos actualizar la solicitud." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
