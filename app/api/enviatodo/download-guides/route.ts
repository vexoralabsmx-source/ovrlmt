import { NextResponse } from "next/server";
import { downloadGuides } from "@/src/lib/enviatodo";
import { badRequest, isRecord, readGuideIds, routeError } from "../_utils";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isRecord(body)) return badRequest("Payload de descarga inválido.");
  const guides = readGuideIds(body.guides);
  if (!guides.length) return badRequest("guides debe incluir al menos una guía.");
  if (guides.length > 10) return badRequest("Máximo 10 guías por descarga.");

  try {
    return NextResponse.json(await downloadGuides({ guides }));
  } catch (error) {
    return routeError(error);
  }
}
