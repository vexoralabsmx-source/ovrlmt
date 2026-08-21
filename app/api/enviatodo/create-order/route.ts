import { NextResponse } from "next/server";
import { createOrder, type EnviatodoCreateOrderRequest } from "@/src/lib/enviatodo";
import { badRequest, cleanString, isRecord, routeError } from "../_utils";
import { requireAdminRequest } from "@/src/lib/adminApi";

export async function POST(request: Request) {
  const auth = await requireAdminRequest(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  if (!isRecord(body)) return badRequest("Payload de orden inválido.");

  const uuid = cleanString(body.uuid, 180);
  const providerId = cleanString(body.provider_id, 40);
  const providerServiceId = cleanString(body.provider_service_id, 40);
  if (!uuid || !providerId || !providerServiceId) return badRequest("uuid, provider_id y provider_service_id son requeridos.");

  const payload: EnviatodoCreateOrderRequest = {
    order: {
      type: "create_order",
      data: {
        uuid,
        detail: {
          provider_id: providerId,
          provider_service_id: providerServiceId,
          insurance: Boolean(body.insurance),
        },
      },
    },
  };

  try {
    return NextResponse.json(await createOrder(payload));
  } catch (error) {
    return routeError(error);
  }
}
