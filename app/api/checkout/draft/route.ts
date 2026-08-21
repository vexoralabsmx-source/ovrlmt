import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { guardRequest } from "@/src/lib/requestSecurity";

export async function POST(request: Request) {
  const blocked = await guardRequest(request, { bucket: "checkout-draft", limit: 20, windowMs: 10 * 60_000, maxBodyBytes: 65_536, requireJson: true });
  if (blocked) return blocked;
  const body = await request.json().catch(() => null) as { email?: unknown; fullName?: unknown; items?: unknown; subtotalMxn?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 180) : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  const items = Array.isArray(body?.items) ? body.items.slice(0, 20) : [];
  const subtotalMxn = Number(body?.subtotalMxn);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !items.length || !Number.isFinite(subtotalMxn)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
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
