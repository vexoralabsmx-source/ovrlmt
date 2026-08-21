import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/src/lib/authServer";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { guardRequest } from "@/src/lib/requestSecurity";

export async function POST(request: Request) {
  const blocked = await guardRequest(request, { bucket: "auth-reset-password", limit: 5, windowMs: 60 * 60_000, maxBodyBytes: 16_384, requireJson: true });
  if (blocked) return blocked;

  const auth = await getUserFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, message: "El enlace no es válido o ya expiró. Solicita uno nuevo." }, { status: auth.status });
  }

  const body = await request.json().catch(() => null) as { password?: string } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 6) {
    return NextResponse.json({ ok: false, message: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().auth.admin.updateUserById(auth.user.id, { password });
  if (error) {
    return NextResponse.json({ ok: false, message: "No pudimos cambiar tu contraseña. Solicita un enlace nuevo." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
