import { NextResponse } from "next/server";
import { getUserFromRequest, isAdminEmail } from "@/src/lib/authServer";
import { guardRequest } from "@/src/lib/requestSecurity";

export async function GET(request: Request) {
  const blocked = await guardRequest(request, { bucket: "auth-session", limit: 60, windowMs: 60_000 });
  if (blocked) return blocked;
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    email: auth.user.email,
    isAdmin: isAdminEmail(auth.user.email),
  });
}
