import { NextResponse } from "next/server";
import { getZipCode } from "@/src/lib/enviatodo";
import { badRequest, routeError } from "../../_utils";

export async function GET(_request: Request, context: { params: Promise<{ zipCode: string }> }) {
  const { zipCode } = await context.params;
  const cleanZipCode = zipCode.replace(/\D/g, "").slice(0, 5);
  if (!/^\d{5}$/.test(cleanZipCode)) return badRequest("Código postal inválido.");

  try {
    return NextResponse.json(await getZipCode(cleanZipCode));
  } catch (error) {
    return routeError(error);
  }
}
