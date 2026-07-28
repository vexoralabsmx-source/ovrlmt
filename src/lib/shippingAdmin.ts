import "server-only";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

export const PAID_ORDER_STATUSES = new Set(["payment_validated", "ready_to_ship"]);
export const ACTIVE_SHIPMENT_STATUSES = new Set(["quoted", "created", "ready_to_ship", "shipped"]);

export type AdminShippingOrder = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  product_name: string;
  size: string;
  quantity: number;
  subtotal_mxn: number;
  shipping_mxn: number;
  total_mxn: number;
  status: string;
  address_city: string;
  address_state: string;
  notes: string | null;
};

export async function getOrderForShipping(orderId: string) {
  return getSupabaseAdmin()
    .from("preorders")
    .select("id,order_code,customer_name,customer_email,customer_whatsapp,product_name,size,quantity,subtotal_mxn,shipping_mxn,total_mxn,status,address_city,address_state,notes")
    .eq("id", orderId)
    .single<AdminShippingOrder>();
}

export async function getActiveShipment(orderId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .in("status", Array.from(ACTIVE_SHIPMENT_STATUSES))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function insertQuotedShipment(input: {
  orderId: string;
  providerId?: string;
  providerServiceId?: string;
  serviceName?: string;
  rateUuid?: string;
  shippingCost?: number;
  rawRateResponse: unknown;
}) {
  return getSupabaseAdmin().from("shipments").insert({
    order_id: input.orderId,
    provider: "enviatodo",
    provider_id: input.providerId || null,
    provider_service_id: input.providerServiceId || null,
    service_name: input.serviceName || null,
    rate_uuid: input.rateUuid || null,
    shipping_cost: input.shippingCost ?? null,
    status: "quoted",
    raw_rate_response: input.rawRateResponse,
  }).select("*").single();
}

export async function insertCreatedShipment(input: {
  orderId: string;
  providerId?: string;
  providerServiceId?: string;
  serviceName?: string;
  rateUuid?: string;
  trxId?: string;
  guideId?: string;
  trackingId?: string;
  trackingLink?: string;
  shippingCost?: number;
  rawRateResponse?: unknown;
  rawOrderResponse: unknown;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("shipments").insert({
    order_id: input.orderId,
    provider: "enviatodo",
    provider_id: input.providerId || null,
    provider_service_id: input.providerServiceId || null,
    service_name: input.serviceName || null,
    rate_uuid: input.rateUuid || null,
    trx_id: input.trxId || null,
    guide_id: input.guideId || null,
    tracking_id: input.trackingId || null,
    tracking_link: input.trackingLink || null,
    shipping_cost: input.shippingCost ?? null,
    status: "created",
    raw_rate_response: input.rawRateResponse || null,
    raw_order_response: input.rawOrderResponse,
  }).select("*").single();

  if (error) return { data: null, error };

  const note = `Guia generada con EnviaTodo${input.trackingId ? `: ${input.trackingId}` : ""}.`;
  await supabase.from("preorders").update({
    status: "ready_to_ship",
    shipping_status: "guide_created",
    tracking_id: input.trackingId || null,
    tracking_link: input.trackingLink || null,
    shipping_provider: "enviatodo",
    shipping_cost_real: input.shippingCost ?? null,
    updated_at: new Date().toISOString(),
  }).eq("id", input.orderId);

  await supabase.from("order_events").insert({ order_id: input.orderId, event_type: "shipment_created", message: note });
  return { data, error: null };
}

export async function markShipmentCancelled(input: { orderId: string; trackingIds: string[]; reason: string; rawResponse: unknown }) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("shipments")
    .update({ status: "cancelled", raw_order_response: input.rawResponse, updated_at: now })
    .eq("order_id", input.orderId)
    .in("tracking_id", input.trackingIds);

  if (error) return { error };

  await supabase.from("preorders").update({ shipping_status: "cancelled", updated_at: now }).eq("id", input.orderId);
  await supabase.from("order_events").insert({
    order_id: input.orderId,
    event_type: "shipment_cancelled",
    message: `Guia cancelada con EnviaTodo. Razon: ${input.reason}`,
  });
  return { error: null };
}
