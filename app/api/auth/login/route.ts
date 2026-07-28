import { NextResponse } from "next/server";
import { isAdminEmail } from "@/src/lib/authServer";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

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
