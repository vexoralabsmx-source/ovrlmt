import { NextResponse } from "next/server";
import { getUserFromRequest, isAdminEmail } from "@/src/lib/authServer";

export async function requireAdminRequest(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return { ok: false as const, response: NextResponse.json({ ok: false, message: auth.message }, { status: auth.status }) };
  if (!isAdminEmail(auth.user.email)) return { ok: false as const, response: NextResponse.json({ ok: false, message: "No tienes acceso admin." }, { status: 403 }) };
  return { ok: true as const, user: auth.user };
}

export function cleanString(value: unknown, maxLength = 240) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}
