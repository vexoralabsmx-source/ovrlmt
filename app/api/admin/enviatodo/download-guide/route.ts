import { NextResponse } from "next/server";
import { cleanString, jsonError, requireAdminRequest } from "@/src/lib/adminApi";
import { downloadGuideBinaries } from "@/src/lib/enviatodo";
import { adminEnviatodoError } from "../_utils";

export async function POST(request: Request) {
  const auth = await requireAdminRequest(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null) as { guideIds?: unknown } | null;
  const guideIds = Array.isArray(body?.guideIds) ? body.guideIds.map((id) => cleanString(id, 120)).filter(Boolean) : [];
  if (!guideIds.length) return jsonError("Agrega al menos una guía.", 400);
  if (guideIds.length > 10) return jsonError("EnviaTodo permite máximo 10 guías por descarga.", 400);
  try {
    const result = await downloadGuideBinaries({ guide_ids: guideIds });
    if (result.status === 429) return jsonError("EnviaTodo limitó las descargas. Intenta de nuevo en unos minutos.", 429);
    return NextResponse.json(result, { status: result.ok ? 200 : result.status });
  } catch (error) {
    return adminEnviatodoError(error);
  }
}
