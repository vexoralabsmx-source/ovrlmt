import "server-only";
import { getClipCheckout, isClipCheckoutPaid } from "@/src/lib/clip";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { sendAdminPreorderNotification, sendOrderStatusEmail, type EmailOrder } from "@/src/lib/resend";

type ClipOrderRow = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  product_name: string;
  size: string;
  quantity: number;
  subtotal_mxn: number;
  discount_mxn: number | null;
  shipping_mxn: number | null;
  total_mxn: number;
  status: string;
  payment_status: string | null;
  address_city: string | null;
  address_state: string | null;
  notes: string | null;
};

export function isValidClipPaymentId(value: string) {
  return /^[a-zA-Z0-9-]{1,80}$/.test(value);
}

function toEmailOrder(order: ClipOrderRow): EmailOrder {
  return {
    orderCode: order.order_code,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerWhatsapp: order.customer_whatsapp,
    productName: order.product_name,
    size: order.size,
    quantity: Number(order.quantity),
    subtotalMxn: Number(order.subtotal_mxn),
    discountMxn: Number(order.discount_mxn || 0),
    shippingMxn: Number(order.shipping_mxn || 0),
    totalMxn: Number(order.total_mxn),
    status: "payment_validated",
    addressCity: order.address_city,
    addressState: order.address_state,
    notes: "Pago con tarjeta confirmado por Clip. Tu pieza entra a producción.",
  };
}

export async function syncClipOrder(paymentRequestId: string) {
  if (!isValidClipPaymentId(paymentRequestId)) throw new Error("Identificador de pago inválido.");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("preorders")
    .select("id,order_code,customer_name,customer_email,customer_whatsapp,product_name,size,quantity,subtotal_mxn,discount_mxn,shipping_mxn,total_mxn,status,payment_status,address_city,address_state,notes")
    .eq("payment_request_id", paymentRequestId)
    .single();

  if (error || !data) throw new Error("No encontramos la orden asociada a este pago.");

  const order = data as ClipOrderRow;
  const checkout = await getClipCheckout(paymentRequestId);
  const paid = isClipCheckoutPaid(checkout.status);
  const paymentStatus = checkout.status.toLowerCase();
  const nextOrderStatus = paid
    ? "payment_validated"
    : checkout.status === "CHECKOUT_CANCELLED" || checkout.status === "CHECKOUT_EXPIRED"
      ? "cancelled"
      : "pending_payment";
  const update = supabase
    .from("preorders")
    .update({
      status: nextOrderStatus,
      payment_status: paymentStatus,
      payment_receipt_no: checkout.receipt_no || null,
      paid_at: paid ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);
  const { data: transitionedRows, error: updateError } = paid
    ? await update.neq("payment_status", "checkout_completed").select("id")
    : await update.select("id");

  if (updateError) throw new Error("No pudimos actualizar el estado de la orden.");

  if (paid && transitionedRows?.length) {
    const emailOrder = toEmailOrder(order);
    await Promise.allSettled([
      sendOrderStatusEmail(emailOrder),
      sendAdminPreorderNotification(emailOrder),
    ]);
  }

  return {
    orderCode: order.order_code,
    totalMxn: Number(order.total_mxn),
    status: checkout.status,
    paid,
    receiptNo: checkout.receipt_no || null,
  };
}
