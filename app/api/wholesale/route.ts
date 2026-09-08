import { NextResponse } from "next/server";
import { readWholesaleRules } from "@/src/lib/wholesale";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { rules } = await readWholesaleRules();
    return NextResponse.json({ rules: rules.filter(rule => rule.active) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "No pudimos cargar los precios de mayoreo." }, { status: 503 }); }
}
