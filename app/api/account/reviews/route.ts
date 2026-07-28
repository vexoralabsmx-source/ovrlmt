import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/src/lib/authServer";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const email = auth.user.email?.toLowerCase();
  const { data, error } = await getSupabaseAdmin()
    .from("reviews")
    .select("id,preorder_id,product_slug,display_name,rating,title,body,image_urls,status,verified_purchase,created_at")
    .eq("customer_email", email)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "No pudimos cargar tus reseñas." }, { status: 500 });
  return NextResponse.json({ ok: true, reviews: data || [] });
}

export async function POST(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const email = auth.user.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Tu cuenta no tiene correo." }, { status: 400 });

  const form = await request.formData();
  const preorderId = String(form.get("preorderId") || "");
  const productSlug = String(form.get("productSlug") || "").trim().slice(0, 100);
  const displayName = String(form.get("displayName") || "").trim().slice(0, 60);
  const title = String(form.get("title") || "").trim().slice(0, 100);
  const body = String(form.get("body") || "").trim().slice(0, 1200);
  const rating = Number(form.get("rating"));
  const files = form.getAll("images").filter((item): item is File => item instanceof File && item.size > 0).slice(0, 3);
  if (!preorderId || !productSlug || !Number.isInteger(rating) || rating < 1 || rating > 5 || body.length < 10) {
    return NextResponse.json({ error: "Calificación y reseña de al menos 10 caracteres son obligatorias." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase
    .from("preorders")
    .select("id,product_slug,status")
    .eq("id", preorderId)
    .eq("customer_email", email)
    .eq("status", "delivered")
    .maybeSingle();
  if (!order || !String(order.product_slug).split(",").includes(productSlug)) {
    return NextResponse.json({ error: "Solo puedes reseñar compras entregadas y verificadas." }, { status: 403 });
  }
  const { data: existing } = await supabase.from("reviews").select("id").eq("preorder_id", preorderId).eq("product_slug", productSlug).maybeSingle();
  if (existing) return NextResponse.json({ error: "Ya enviaste una reseña para esta pieza." }, { status: 409 });

  const imageUrls: string[] = [];
  for (const file of files) {
    if (!IMAGE_TYPES.has(file.type) || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Las fotos deben ser JPG, PNG o WebP y pesar menos de 5 MB." }, { status: 400 });
    }
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${auth.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("review-images").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return NextResponse.json({ error: "No pudimos subir una de tus fotos." }, { status: 500 });
    imageUrls.push(supabase.storage.from("review-images").getPublicUrl(path).data.publicUrl);
  }

  const { error } = await supabase.from("reviews").insert({
    preorder_id: preorderId,
    product_slug: productSlug,
    customer_email: email,
    display_name: displayName || null,
    rating,
    title: title || null,
    body,
    image_urls: imageUrls,
    verified_purchase: true,
    created_by_admin: false,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: "No pudimos guardar tu reseña." }, { status: 500 });
  return NextResponse.json({ ok: true, message: "Reseña enviada. La publicaremos después de revisarla." });
}
