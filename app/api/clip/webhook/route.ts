import { NextResponse } from "next/server";
import { isValidClipPaymentId, syncClipOrder } from "@/src/lib/clipOrders";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    id?: unknown;
    origin?: unknown;
    event_type?: unknown;
  } | null;

  const id = typeof body?.id === "string" ? body.id : "";
  const validEvent = body?.event_type === "INSERT" || body?.event_type === "UPDATE";
  if (body?.origin !== "checkout-api" || !validEvent || !isValidClipPaymentId(id)) {
    return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  }

  try {
    await syncClipOrder(id);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "No se pudo procesar el evento." }, { status: 500 });
  }
}
