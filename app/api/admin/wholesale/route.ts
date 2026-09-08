import { NextResponse } from "next/server";
import { requireAdminRequest, isUuid, jsonError } from "@/src/lib/adminApi";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { readWholesaleRules } from "@/src/lib/wholesale";
import { validateWholesaleRule } from "@/data/wholesale";
import { getCatalogProducts } from "@/src/lib/catalog";
export async function GET(request: Request) {
  const auth = await requireAdminRequest(request);
  if (!auth.ok) return auth.response;
  try {
    const [settings, products] = await Promise.all([readWholesaleRules(), getCatalogProducts({ requireLive: true })]);
    return NextResponse.json({ ...settings, products: products.map(p => ({ slug: p.slug, name: p.name, priceMxn: p.priceMxn })) });
  } catch { return jsonError("No pudimos cargar mayoreo.", 503); }
}
async function save(request: Request, update: boolean) {
  const auth = await requireAdminRequest(request);
  if (!auth.ok) return auth.response;
  const body: unknown = await request.json().catch(() => null);
  try {
    const payload = validateWholesaleRule(body);
    const id = (body as { id?: string }).id || "";
    if (update && !isUuid(id)) return jsonError("Escalón inválido.");
    const catalog = await getCatalogProducts({ requireLive: true });
    const product = catalog.find(p => p.slug === payload.product_slug);
    if (!product) return jsonError("No pudimos verificar este modelo en el catálogo.");
    if (payload.discount_type === "fixed" && payload.discount_value >= product.priceMxn) return jsonError("La rebaja por pieza debe ser menor que su precio.");
    const query = getSupabaseAdmin().from("wholesale_rules");
    const { data, error } = await (update ? query.update(payload).eq("id", id) : query.insert(payload)).select("id");
    if (error) return jsonError(error.code === "23505" ? "Ya existe un escalón con ese mínimo para este modelo." : "No se guardó el escalón. Verifica la configuración de mayoreo.", error.code === "23505" ? 409 : 503);
    if (!data?.length) return jsonError("El escalón ya no existe. Actualiza el panel.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) { return jsonError(error instanceof Error ? error.message : "Datos inválidos."); }
}
export async function POST(request: Request) { return save(request, false); }
export async function PATCH(request: Request) { return save(request, true); }
export async function DELETE(request: Request) {
  const auth = await requireAdminRequest(request);
  if (!auth.ok) return auth.response;
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!isUuid(id)) return jsonError("Escalón inválido.");
  const { error } = await getSupabaseAdmin().from("wholesale_rules").delete().eq("id", id);
  return error ? jsonError("No pudimos eliminar el escalón.", 503) : NextResponse.json({ ok: true });
}
