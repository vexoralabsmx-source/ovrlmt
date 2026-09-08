import { MAX_ITEM_QUANTITY } from "@/data/wholesale";
import { getCatalogProducts } from "@/src/lib/catalog";
import { SIZES } from "@/data/store";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { guardRequest } from "@/src/lib/requestSecurity";

export async function POST(request: Request) {
  const blocked = await guardRequest(request, { bucket: "checkout-draft", limit: 20, windowMs: 10 * 60_000, maxBodyBytes: 65_536, requireJson: true });
  if (blocked) return blocked;
  const body = await request.json().catch(() => null) as { email?: unknown; fullName?: unknown; items?: unknown; subtotalMxn?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 180) : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  const requestedItems: unknown[] = Array.isArray(body?.items) ? body.items : [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !requestedItems.length || requestedItems.length > 20) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const catalog = await getCatalogProducts({ requireLive: true });
  const items = [];
  for (const requested of requestedItems) {
    if (!requested || typeof requested !== "object") return NextResponse.json({ ok: false }, { status: 400 });
    const item = requested as Record<string, unknown>;
    const product = catalog.find(p => p.slug === item.slug && p.productStatus === "active");
    const size = SIZES.find(size => size === item.size);
    const quantity = Number(item.quantity);
    if (!product || !size || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) return NextResponse.json({ ok: false }, { status: 400 });
    items.push({ slug: product.slug, name: product.name, image: product.image, size, quantity, priceMxn: product.priceMxn });
  }
  const subtotalMxn = items.reduce((total, item) => total + item.priceMxn * item.quantity, 0);
  const { error } = await getSupabaseAdmin().from("checkout_drafts").upsert({
    customer_email: email,
    customer_name: fullName || null,
    items,
    subtotal_mxn: subtotalMxn,
    checkout_url: "/cart",
    recovery_sent_at: null,
    recovered_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "customer_email" });
  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
