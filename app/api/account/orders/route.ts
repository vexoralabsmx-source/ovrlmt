import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/src/lib/authServer";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

export async function GET(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

  const email = auth.user.email?.toLowerCase();
  if (!email) return NextResponse.json({ ok: false, message: "Tu cuenta no tiene correo." }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from("preorders")
    .select("id,order_code,product_name,size,quantity,total_mxn,status,notes,created_at,updated_at")
    .eq("customer_email", email)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, message: "No pudimos cargar tus pedidos." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orders: data });
}
