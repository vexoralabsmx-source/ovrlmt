import { NextResponse } from "next/server";
import { cleanString, isUuid, jsonError, requireAdminRequest } from "@/src/lib/adminApi";
import { quoteShipment } from "@/src/lib/enviatodo";
import { getOrderForShipping, insertQuotedShipment } from "@/src/lib/shippingAdmin";
import { adminEnviatodoError } from "../_utils";

function firstRate(data: unknown) {
  const value = data as { rates?: unknown[]; data?: { rates?: unknown[] } };
  return (Array.isArray(value?.rates) ? value.rates[0] : value?.data?.rates?.[0]) as Record<string, unknown> | undefined;
}

export async function POST(request: Request) {
  const auth = await requireAdminRequest(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null) as { orderId?: string; payload?: unknown } | null;
  const orderId = cleanString(body?.orderId, 80);
  if (!orderId || !isUuid(orderId)) return jsonError("orderId inválido.", 400);
  if (!body?.payload || typeof body.payload !== "object") return jsonError("Payload de cotización inválido.", 400);

  const { data: order, error } = await getOrderForShipping(orderId);
  if (error || !order) return jsonError("Pedido no encontrado.", 404);

  let result;
  try {
    result = await quoteShipment(body.payload);
  } catch (error) {
    console.warn("enviatodo_rates_failed", { orderId });
    return adminEnviatodoError(error);
  }

  const rate = firstRate(result.data);
  if (rate) {
    await insertQuotedShipment({
      orderId,
      providerId: String(rate.provider_id || ""),
      providerServiceId: String(rate.provider_service_id || ""),
      serviceName: String(rate.service || rate.service_name || ""),
      rateUuid: String(rate.uuid || ""),
      shippingCost: Number(rate.total || 0) || undefined,
      rawRateResponse: result.data,
    });
  }

  return NextResponse.json(result);
}
