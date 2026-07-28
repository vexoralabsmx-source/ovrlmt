import { NextResponse } from "next/server";
import { EnviatodoError, toSafeEnviatodoError } from "@/src/lib/enviatodo";

export function routeError(error: unknown) {
  const safeError = toSafeEnviatodoError(error);
  const status = error instanceof EnviatodoError ? error.status : safeError.status;
  if (status >= 500) console.error("enviatodo_route_error", { status, message: safeError.message });
  return NextResponse.json(safeError, { status });
}

export function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function cleanString(value: unknown, maxLength = 160) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function readGuideIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanString(item, 120)).filter(Boolean);
}
