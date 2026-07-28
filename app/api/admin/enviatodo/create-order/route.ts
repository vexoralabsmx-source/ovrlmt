import { NextResponse } from "next/server";
import { cleanString, isUuid, jsonError, requireAdminRequest } from "@/src/lib/adminApi";
import { createShipmentOrder } from "@/src/lib/enviatodo";
import { getActiveShipment, getOrderForShipping, insertCreatedShipment, PAID_ORDER_STATUSES } from "@/src/lib/shippingAdmin";
import { adminEnviatodoError } from "../_utils";

function pickString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

export async function POST(request: Request) {
  const auth = await requireAdminRequest(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null) as {
    orderId?: string;
    quoteUuid?: string;
    providerId?: string;
    providerServiceId?: string;
    serviceName?: string;
    shippingCost?: number;
    force?: boolean;
  } | null;
  const orderId = cleanString(body?.orderId, 80);
  if (!orderId || !isUuid(orderId)) return jsonError("orderId inválido.", 400);
  const quoteUuid = cleanString(body?.quoteUuid, 160);
  const providerId = cleanString(body?.providerId, 120);
  const providerServiceId = cleanString(body?.providerServiceId, 120);
  if (!quoteUuid || !providerId || !providerServiceId) return jsonError("Faltan datos de cotización para crear guía.", 400);

  const { data: order, error } = await getOrderForShipping(orderId);
  if (error || !order) return jsonError("Pedido no encontrado.", 404);
  if (!PAID_ORDER_STATUSES.has(order.status)) return jsonError("Valida el pago antes de crear una guía.", 409);

  const activeShipment = await getActiveShipment(orderId);
  if (activeShipment && !body?.force) return jsonError("Este pedido ya tiene una guía activa. Confirma para crear otra.", 409, { activeShipment });

  const payload = {
    order: {
      type: "create_order",
      data: {
        uuid: quoteUuid,
        detail: {
          provider_id: providerId,
          provider_service_id: providerServiceId,
          insurance: false,
        },
      },
    },
  };

  let result;
  try {
    result = await createShipmentOrder(payload);
  } catch (error) {
    console.warn("enviatodo_create_order_failed", { orderId });
    return adminEnviatodoError(error);
  }

  const responseData = (result.data || {}) as Record<string, unknown>;
  const nestedData = typeof responseData.data === "object" && responseData.data ? responseData.data as Record<string, unknown> : responseData;
  const trackingId = pickString(nestedData, ["tracking_id", "tracking", "tracking_number"]);
  const trackingLink = pickString(nestedData, ["tracking_link", "tracking_url", "url_tracking"]);
  const guideId = pickString(nestedData, ["guide_id", "file_id", "id_guide"]);
  const trxId = pickString(nestedData, ["trx_id", "transaction_id"]);

  const saved = await insertCreatedShipment({
    orderId,
    providerId,
    providerServiceId,
    serviceName: cleanString(body?.serviceName, 160),
    rateUuid: quoteUuid,
    trxId,
    guideId,
    trackingId,
    trackingLink,
    shippingCost: Number(body?.shippingCost || 0) || undefined,
    rawOrderResponse: result.data,
  });

  if (saved.error) return jsonError("La guía se creó, pero no pudimos guardarla en base de datos.", 500);

  return NextResponse.json({ ...result, shipment: saved.data });
}
