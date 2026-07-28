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
    .from("reviews")
    .select("id,product_slug,display_name,rating,title,body,image_urls,status,verified_purchase,created_by_admin,created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "No pudimos cargar reseñas." }, { status: 500 });
  return NextResponse.json({ ok: true, reviews: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const body = await request.json() as Record<string, unknown>;
  const productSlug = String(body.productSlug || "").trim().slice(0, 100);
  const displayName = String(body.displayName || "").trim().slice(0, 60);
  const reviewBody = String(body.body || "").trim().slice(0, 1200);
  const title = String(body.title || "").trim().slice(0, 100);
  const rating = Number(body.rating);
  const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.map(String).filter((url) => /^https:\/\//.test(url)).slice(0, 3) : [];
  if (!productSlug || !Number.isInteger(rating) || rating < 1 || rating > 5 || reviewBody.length < 10) {
    return NextResponse.json({ error: "Completa producto, estrellas y reseña." }, { status: 400 });
  }
  const { error } = await getSupabaseAdmin().from("reviews").insert({
    product_slug: productSlug,
    display_name: displayName || null,
    rating,
    title: title || null,
    body: reviewBody,
    image_urls: imageUrls,
    verified_purchase: false,
    created_by_admin: true,
    status: "approved",
  });
  if (error) return NextResponse.json({ error: "No pudimos crear la reseña." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const body = await request.json() as { id?: unknown; status?: unknown };
  const id = typeof body.id === "string" ? body.id : "";
  const status = body.status === "approved" || body.status === "rejected" || body.status === "pending" ? body.status : "";
  if (!id || !status) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("reviews").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "No pudimos actualizar la reseña." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
