import { NextResponse } from "next/server";
import { getUserFromRequest, isAdminEmail } from "@/src/lib/authServer";

export async function GET(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    email: auth.user.email,
    isAdmin: isAdminEmail(auth.user.email),
  });
}
