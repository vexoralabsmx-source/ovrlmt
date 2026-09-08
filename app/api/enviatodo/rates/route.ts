import { publicShippingQuoteEnabled } from "@/src/lib/shippingFeature";
import { NextResponse } from "next/server";
import { getRates, type EnviatodoQuoteRequest } from "@/src/lib/enviatodo";
import { badRequest, cleanString, isRecord, routeError } from "../_utils";
import { guardRequest } from "@/src/lib/requestSecurity";

export async function POST(request: Request) {
  if (!publicShippingQuoteEnabled()) return NextResponse.json({ message: "Consulta el costo de envío en tu carrito." }, { status: 404 });
  const blocked = await guardRequest(request, { bucket: "shipping-rates", limit: 15, windowMs: 60_000, maxBodyBytes: 32_768, requireJson: true });
  if (blocked) return blocked;
  const body = await request.json().catch(() => null);
  if (!isRecord(body)) return badRequest("Payload de cotización inválido.");
  if (!isRecord(body.origin)) return badRequest("origin es requerido.");
  if (!isRecord(body.destination)) return badRequest("destination es requerido.");
  if (!isRecord(body.package)) return badRequest("package es requerido.");

  if (!/^\d{5}$/.test(String(body.origin.zip_code || "")) || !/^\d{5}$/.test(String(body.destination.zip_code || ""))) return badRequest("Ingresa un código postal de 5 dígitos.");
  const providerId = cleanString(body.provider_id, 40);
  const providerServiceId = cleanString(body.provider_service_id, 40);
  const shippingType = cleanString(body.shipping_type, 20) || "1";
  const quantity = Number(body.quantity || 1);

  const payload: EnviatodoQuoteRequest = {
    type: "order",
    quotes: {
      shipping_type: shippingType,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      ...(providerId ? { provider_id: providerId } : {}),
      ...(providerServiceId ? { provider_service_id: providerServiceId } : {}),
      origin: body.origin,
      destination: body.destination,
      package: body.package,
    },
  };

  try {
    return NextResponse.json(await getRates(payload));
  } catch (error) {
    return routeError(error);
  }
}
