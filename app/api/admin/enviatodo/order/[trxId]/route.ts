import { NextResponse } from "next/server";
import { cleanString, jsonError, requireAdminRequest } from "@/src/lib/adminApi";
import { getOrderByTrxId } from "@/src/lib/enviatodo";
import { adminEnviatodoError } from "../../_utils";

export async function GET(request: Request, context: { params: Promise<{ trxId: string }> }) {
  const auth = await requireAdminRequest(request);
  if (!auth.ok) return auth.response;
  const { trxId } = await context.params;
  const cleanTrxId = cleanString(trxId, 120);
  if (!cleanTrxId) return jsonError("trxId inválido.", 400);
  try {
    const result = await getOrderByTrxId(cleanTrxId);
    return NextResponse.json(result, { status: result.ok ? 200 : result.status });
  } catch (error) {
    return adminEnviatodoError(error);
  }
}
