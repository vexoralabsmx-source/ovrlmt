import { NextResponse } from "next/server";
import { cleanString, isUuid, jsonError, requireAdminRequest } from "@/src/lib/adminApi";
import { cancelOrder } from "@/src/lib/enviatodo";
import { markShipmentCancelled } from "@/src/lib/shippingAdmin";
import { adminEnviatodoError } from "../_utils";

export async function POST(request: Request) {
  const auth = await requireAdminRequest(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null) as { orderId?: string; trackingIds?: unknown; reason?: string; orderType?: string } | null;
  const orderId = cleanString(body?.orderId, 80);
  if (!orderId || !isUuid(orderId)) return jsonError("orderId inválido.", 400);
  const trackingIds = Array.isArray(body?.trackingIds) ? body.trackingIds.map((id) => cleanString(id, 120)).filter(Boolean) : [];
  const reason = cleanString(body?.reason, 300);
  if (!trackingIds.length) return jsonError("Agrega al menos un tracking para cancelar.", 400);
  if (!reason) return jsonError("Agrega una razón de cancelación.", 400);

  const now = new Date().toISOString();
  const payload = {
    tracking_ids: trackingIds,
    cancelled_at: now,
    refunded_at: now,
    reason,
    order_type: cleanString(body?.orderType, 80) || "shipment",
  };
  let result;
  try {
    result = await cancelOrder(payload);
  } catch (error) {
    return adminEnviatodoError(error);
  }
  const saved = await markShipmentCancelled({ orderId, trackingIds, reason, rawResponse: result.data });
  if (saved.error) return jsonError("Guía cancelada, pero no pudimos actualizar la base de datos.", 500);
  return NextResponse.json(result);
}
