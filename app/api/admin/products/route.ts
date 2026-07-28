import { NextResponse } from "next/server";
import { SIZES, type ProductSize } from "@/data/store";
import { getUserFromRequest, isAdminEmail } from "@/src/lib/authServer";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

const VALID_STATUSES = new Set(["draft", "active", "sold_out", "hidden"]);
const VALID_ACCENTS = new Set(["black", "bone", "chrome"]);

async function requireAdmin(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return auth;
  if (!isAdminEmail(auth.user.email)) return { ok: false as const, status: 403, message: "No tienes acceso admin." };
  return auth;
}
function clean(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanImages(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => clean(item, 500)).filter(Boolean).slice(0, 8);
  return clean(value, 2000).split(/\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 8);
}

function cleanStock(value: unknown) {
  const source = typeof value === "object" && value ? value as Record<string, { total?: number; reserved?: number; sold?: number }> : {};
  return SIZES.map((size) => ({
    size,
    total: Math.max(0, Math.round(Number(source[size]?.total) || 0)),
    reserved: Math.max(0, Math.round(Number(source[size]?.reserved) || 0)),
    sold: Math.max(0, Math.round(Number(source[size]?.sold) || 0)),
  }));
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  const { data: products, error } = await supabase
    .from("products")
    .select("id,slug,name,drop_number,price_mxn,image_url,images,active,status,description,color,fit,material,print_method,featured,story,code,accent,created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ ok: false, message: "No pudimos cargar productos." }, { status: 500 });

  const ids = (products || []).map((product) => product.id);
  const { data: stock } = ids.length
    ? await supabase.from("product_stock").select("product_id,size,total,reserved,sold").in("product_id", ids)
    : { data: [] };

  return NextResponse.json({ ok: true, products: products || [], stock: stock || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

  const body = await request.json();
  const slug = clean(body.slug, 120).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  const name = clean(body.name, 160);
  const status = VALID_STATUSES.has(body.status) ? body.status : "draft";
  const accent = VALID_ACCENTS.has(body.accent) ? body.accent : "black";
  const images = cleanImages(body.images);

  if (!slug || !name) return NextResponse.json({ ok: false, message: "Nombre y slug son obligatorios." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      slug,
      name,
      drop_number: clean(body.drop, 40) || null,
      price_mxn: Math.max(1, Math.round(Number(body.priceMxn) || 0)),
      image_url: images[0] || clean(body.imageUrl, 500) || null,
      images,
      active: status === "active" || status === "sold_out",
      status,
      description: clean(body.description, 900) || null,
      color: clean(body.color, 80) || "Negro",
      fit: clean(body.fit, 120) || "Premium fit",
      material: clean(body.material, 160) || null,
      print_method: clean(body.printMethod, 160) || null,
      featured: Boolean(body.featured),
      story: clean(body.story, 900) || null,
      code: clean(body.code, 80) || null,
      accent,
    })
    .select("id")
    .single();

  if (error || !product) return NextResponse.json({ ok: false, message: "No pudimos crear el producto." }, { status: 500 });

  const stockRows = cleanStock(body.stock).map((row) => ({ product_id: product.id, ...row }));
  await supabase.from("product_stock").upsert(stockRows, { onConflict: "product_id,size" });

  return NextResponse.json({ ok: true, id: product.id });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

  const body = await request.json();
  const id = clean(body.id, 80);
  const status = VALID_STATUSES.has(body.status) ? body.status : "draft";
  const accent = VALID_ACCENTS.has(body.accent) ? body.accent : "black";
  const images = cleanImages(body.images);
  if (!id) return NextResponse.json({ ok: false, message: "Falta id del producto." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("products")
    .update({
      slug: clean(body.slug, 120).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
      name: clean(body.name, 160),
      drop_number: clean(body.drop, 40) || null,
      price_mxn: Math.max(1, Math.round(Number(body.priceMxn) || 0)),
      image_url: images[0] || clean(body.imageUrl, 500) || null,
      images,
      active: status === "active" || status === "sold_out",
      status,
      description: clean(body.description, 900) || null,
      color: clean(body.color, 80) || "Negro",
      fit: clean(body.fit, 120) || "Premium fit",
      material: clean(body.material, 160) || null,
      print_method: clean(body.printMethod, 160) || null,
      featured: Boolean(body.featured),
      story: clean(body.story, 900) || null,
      code: clean(body.code, 80) || null,
      accent,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ ok: false, message: "No pudimos guardar el producto." }, { status: 500 });

  const stockRows = cleanStock(body.stock).map((row) => ({ product_id: id, ...row }));
  await supabase.from("product_stock").upsert(stockRows, { onConflict: "product_id,size" });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const id = clean(searchParams.get("id"), 80);
  if (!id) return NextResponse.json({ ok: false, message: "Falta id del producto." }, { status: 400 });

  const { error } = await getSupabaseAdmin().from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, message: "No pudimos eliminar el producto." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
