import { NextResponse } from "next/server";
import { isAdminEmail } from "@/src/lib/authServer";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { guardRequest } from "@/src/lib/requestSecurity";

export async function POST(request: Request) {
  const blocked = await guardRequest(request, { bucket: "auth-login", limit: 10, windowMs: 15 * 60_000, maxBodyBytes: 16_384, requireJson: true });
  if (blocked) return blocked;
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ ok: false, message: "Escribe correo y contrasena." }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin().auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user.email) {
    return NextResponse.json({ ok: false, message: error?.message || "No pudimos iniciar sesion." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    email: data.user.email,
    isAdmin: isAdminEmail(data.user.email),
  });
}
