import { NextResponse } from "next/server";
import { getUserFromRequest, isAdminEmail } from "@/src/lib/authServer";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

async function requireAdmin(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return auth;
  if (!isAdminEmail(auth.user.email)) return { ok: false as const, status: 403, message: "Sin acceso." };
  return auth;
}

function cleanCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 60) : "";
}

function couponPayload(body: Record<string, unknown>) {
  const code = cleanCode(body.code);
  const type = body.type === "fixed" ? "fixed" : "percent";
  const value = Math.max(0, Math.round(Number(body.value) || 0));
  const maxUsesInput = Number(body.maxUses);
  const maxUses = Number.isInteger(maxUsesInput) && maxUsesInput > 0 ? maxUsesInput : null;
  const active = body.active !== false;
  return { code, type, value, maxUses, active };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { data, error } = await getSupabaseAdmin()
    .from("coupons")
    .select("id,code,type,value,active,max_uses,used_count,created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "No pudimos cargar cupones." }, { status: 500 });
  return NextResponse.json({ ok: true, coupons: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const payload = couponPayload(body);
  if (!payload.code || payload.value <= 0 || (payload.type === "percent" && payload.value > 100)) {
    return NextResponse.json({ error: "Completa código, tipo y descuento válido." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().from("coupons").insert({
    code: payload.code,
    type: payload.type,
    value: payload.value,
    active: payload.active,
    max_uses: payload.maxUses,
    used_count: 0,
  });

  if (error) {
    const duplicate = String(error.message || "").toLowerCase().includes("duplicate");
    return NextResponse.json({ error: duplicate ? "Ese cupón ya existe." : "No pudimos crear el cupón." }, { status: duplicate ? 409 : 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const payload = couponPayload(body);
  if (!id || !payload.code || payload.value <= 0 || (payload.type === "percent" && payload.value > 100)) {
    return NextResponse.json({ error: "Datos de cupón inválidos." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("coupons")
    .update({
      code: payload.code,
      type: payload.type,
      value: payload.value,
      active: payload.active,
      max_uses: payload.maxUses,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "No pudimos actualizar el cupón." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Cupón inválido." }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("coupons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "No pudimos eliminar el cupón." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
