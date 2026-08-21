import { NextResponse } from "next/server";
import { getZipCode } from "@/src/lib/enviatodo";
import { badRequest, routeError } from "../../_utils";
import { guardRequest } from "@/src/lib/requestSecurity";

export async function GET(request: Request, context: { params: Promise<{ zipCode: string }> }) {
  const blocked = await guardRequest(request, { bucket: "shipping-zip", limit: 40, windowMs: 60_000 });
  if (blocked) return blocked;
  const { zipCode } = await context.params;
  const cleanZipCode = zipCode.replace(/\D/g, "").slice(0, 5);
  if (!/^\d{5}$/.test(cleanZipCode)) return badRequest("Código postal inválido.");

  try {
    return NextResponse.json(await getZipCode(cleanZipCode));
  } catch (error) {
    return routeError(error);
  }
}
