import { NextResponse } from "next/server";
import { getZipCode } from "@/src/lib/enviatodo";
import { guardRequest } from "@/src/lib/requestSecurity";

function findString(value: unknown, keys: string[]): string {
  if (!value || typeof value !== "object") return "";
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findString(item, keys);
      if (found) return found;
    }
    return "";
  }
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const entry = record[key];
    if (typeof entry === "string" && entry.trim()) return entry.trim();
  }
  for (const entry of Object.values(record)) {
    const found = findString(entry, keys);
    if (found) return found;
  }
  return "";
}

export async function GET(request: Request, context: { params: Promise<{ zipCode: string }> }) {
  const blocked = await guardRequest(request, { bucket: "postal-code", limit: 40, windowMs: 60_000 });
  if (blocked) return blocked;
  const { zipCode } = await context.params;
  const postalCode = zipCode.replace(/\D/g, "").slice(0, 5);
  if (!/^\d{5}$/.test(postalCode)) return NextResponse.json({ error: "Código postal inválido." }, { status: 400 });

  try {
    const result = await getZipCode(postalCode);
    const state = findString(result, ["state", "estado", "state_name"]);
    const city = findString(result, ["city", "ciudad", "municipality", "municipio"]);
    if (state || city) return NextResponse.json({ ok: true, state, city, source: "enviatodo" });
  } catch {
    // Continue with the public postal-code fallback.
  }

  const response = await fetch(`https://api.zippopotam.us/MX/${postalCode}`, { next: { revalidate: 86400 } });
  if (!response.ok) return NextResponse.json({ error: "No encontramos ese código postal." }, { status: 404 });
  const result = await response.json() as { places?: Array<{ "place name"?: string; state?: string }> };
  const place = result.places?.[0];
  return NextResponse.json({ ok: true, city: place?.["place name"] || "", state: place?.state || "", source: "postal" });
}
