import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { guardRequest } from "@/src/lib/requestSecurity";

export async function GET(request: Request) {
  const blocked = await guardRequest(request, { bucket: "public-reviews", limit: 120, windowMs: 60_000 });
  if (blocked) return blocked;
  const product = new URL(request.url).searchParams.get("product")?.trim().slice(0, 100);
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("reviews")
    .select("id,product_slug,display_name,rating,title,body,image_urls,verified_purchase,created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);
  if (product) query = query.eq("product_slug", product);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "No pudimos cargar las reseñas." }, { status: 500 });
  return NextResponse.json({
    ok: true,
    reviews: (data || []).map((review) => ({ ...review, display_name: review.display_name || "Anónimo" })),
  });
}
