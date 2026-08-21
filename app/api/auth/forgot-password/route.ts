import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { guardRequest } from "@/src/lib/requestSecurity";

function recoveryRedirect(request: Request) {
  const requestUrl = new URL(request.url);
  const isLocal = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const origin = configuredSite || (isLocal ? requestUrl.origin : "https://ovrlmt.xyz");
  return new URL("/recuperar-contrasena", origin).toString();
}

export async function POST(request: Request) {
  const blocked = await guardRequest(request, { bucket: "auth-forgot-password", limit: 5, windowMs: 60 * 60_000, maxBodyBytes: 16_384, requireJson: true });
  if (blocked) return blocked;

  const body = await request.json().catch(() => null) as { email?: string } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "Escribe un correo válido." }, { status: 400 });
  }

  await getSupabaseAdmin().auth.resetPasswordForEmail(email, {
    redirectTo: recoveryRedirect(request),
  });

  return NextResponse.json({
    ok: true,
    message: "Si existe una cuenta con ese correo, recibirás un enlace para cambiar tu contraseña.",
  });
}
