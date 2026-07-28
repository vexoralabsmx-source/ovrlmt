import { NextResponse } from "next/server";
import { sendAbandonedCartEmail } from "@/src/lib/resend";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Sin autorización." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: drafts, error } = await supabase
    .from("checkout_drafts")
    .select("id,customer_email,customer_name,items,subtotal_mxn,checkout_url")
    .is("recovery_sent_at", null)
    .is("recovered_at", null)
    .lt("updated_at", cutoff)
    .limit(50);
  if (error) return NextResponse.json({ error: "No pudimos consultar carritos." }, { status: 500 });
  let sent = 0;
  for (const draft of drafts || []) {
    const items = Array.isArray(draft.items) ? draft.items as Array<{ name?: string; quantity?: number }> : [];
    const result = await sendAbandonedCartEmail({
      email: draft.customer_email,
      customerName: draft.customer_name,
      itemSummary: items.map((item) => `${item.quantity || 1}x ${item.name || "Pieza OVRLMT"}`).join(", "),
      subtotalMxn: Number(draft.subtotal_mxn),
      checkoutUrl: `${(process.env.APP_BASE_URL || "https://ovrlmt.xyz").replace(/\/+$/, "")}${draft.checkout_url}`,
    });
    if (result.ok) {
      sent += 1;
      await supabase.from("checkout_drafts").update({ recovery_sent_at: new Date().toISOString() }).eq("id", draft.id);
    }
  }
  return NextResponse.json({ ok: true, sent });
}
