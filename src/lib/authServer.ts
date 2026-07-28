import "server-only";
import type { User } from "@supabase/supabase-js";
import { ADMIN_EMAIL } from "@/src/lib/authConfig";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; status: number; message: string };

export async function getUserFromRequest(request: Request): Promise<AuthResult> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";

  if (!token) {
    return { ok: false, status: 401, message: "Inicia sesion para continuar." };
  }

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, status: 401, message: "Tu sesion expiro. Inicia sesion otra vez." };
  }

  return { ok: true, user: data.user };
}

export function isAdminEmail(email?: string | null) {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}
