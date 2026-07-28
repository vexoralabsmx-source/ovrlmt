import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Sin autorización." }, { status: 401 });
  }
  const { data, error } = await getSupabaseAdmin().rpc("release_expired_stock_reservations");
  if (error) return NextResponse.json({ error: "No pudimos liberar reservas." }, { status: 500 });
  return NextResponse.json({ ok: true, released: Number(data || 0) });
}
