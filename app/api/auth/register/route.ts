import { NextResponse } from "next/server";
import { isAdminEmail } from "@/src/lib/authServer";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { guardRequest } from "@/src/lib/requestSecurity";

export async function POST(request: Request) {
  const blocked = await guardRequest(request, { bucket: "auth-register", limit: 5, windowMs: 60 * 60_000, maxBodyBytes: 16_384, requireJson: true });
  if (blocked) return blocked;
  const body = await request.json().catch(() => null) as { email?: string; password?: string; name?: string } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 120) : "";

  if (!email || password.length < 6) {
    return NextResponse.json({ ok: false, message: "Usa un correo valido y contrasena de minimo 6 caracteres." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { name } : undefined,
  });

  if (created.error) {
    return NextResponse.json({ ok: false, message: created.error.message }, { status: 400 });
  }

  const signedIn = await supabase.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session || !signedIn.data.user.email) {
    return NextResponse.json({ ok: false, message: signedIn.error?.message || "Cuenta creada. Inicia sesion para continuar." }, { status: 201 });
  }

  return NextResponse.json({
    ok: true,
    accessToken: signedIn.data.session.access_token,
    refreshToken: signedIn.data.session.refresh_token,
    email: signedIn.data.user.email,
    isAdmin: isAdminEmail(signedIn.data.user.email),
  });
}
