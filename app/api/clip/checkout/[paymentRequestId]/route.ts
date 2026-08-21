import { NextResponse } from "next/server";
import { syncClipOrder } from "@/src/lib/clipOrders";
import { guardRequest } from "@/src/lib/requestSecurity";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ paymentRequestId: string }> },
) {
  const blocked = await guardRequest(request, { bucket: "clip-payment-status", limit: 120, windowMs: 60_000 });
  if (blocked) return blocked;
  const { paymentRequestId } = await context.params;

  try {
    return NextResponse.json({ ok: true, ...(await syncClipOrder(paymentRequestId)) });
  } catch (error) {
    const detail = process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: "No pudimos confirmar el pago todavía.", ...(detail ? { detail } : {}) },
      { status: 502 },
    );
  }
}
