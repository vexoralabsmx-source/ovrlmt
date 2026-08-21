import { NextResponse } from "next/server";
import { validateCoupon } from "@/src/lib/coupons";
import { guardRequest } from "@/src/lib/requestSecurity";

export async function POST(request: Request) {
  const blocked = await guardRequest(request, { bucket: "coupon-validation", limit: 30, windowMs: 60_000, maxBodyBytes: 16_384, requireJson: true });
  if (blocked) return blocked;
  const body = await request.json().catch(() => null) as { code?: unknown; subtotalMxn?: unknown; email?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : "";
  const subtotalMxn = Number(body?.subtotalMxn);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!code || !Number.isFinite(subtotalMxn) || subtotalMxn <= 0 || !email) {
    return NextResponse.json({ error: "Agrega tu correo y un cupón válido." }, { status: 400 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await validateCoupon(code, subtotalMxn, email)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Cupón inválido." }, { status: 400 });
  }
}
