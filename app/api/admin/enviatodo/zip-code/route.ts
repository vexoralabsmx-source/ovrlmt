import { NextResponse } from "next/server";
import { cleanString, jsonError, requireAdminRequest } from "@/src/lib/adminApi";
import { getZipCode } from "@/src/lib/enviatodo";
import { adminEnviatodoError } from "../_utils";

export async function GET(request: Request) {
  const auth = await requireAdminRequest(request);
  if (!auth.ok) return auth.response;
  const zip = cleanString(new URL(request.url).searchParams.get("zip"), 5).replace(/\D/g, "");
  if (!/^\d{5}$/.test(zip)) return jsonError("Código postal inválido.", 400);
  try {
    const result = await getZipCode(zip);
    return NextResponse.json(result, { status: result.ok ? 200 : result.status });
  } catch (error) {
    return adminEnviatodoError(error);
  }
}
