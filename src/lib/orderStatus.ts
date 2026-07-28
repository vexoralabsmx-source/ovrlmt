export const ORDER_STATUSES = [
  { value: "pending_payment", label: "Pago pendiente" },
  { value: "payment_validated", label: "Pago validado" },
  { value: "in_production", label: "En produccion" },
  { value: "ready_to_ship", label: "Listo para enviar" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

export function getOrderStatusLabel(status: string) {
  return ORDER_STATUSES.find((item) => item.value === status)?.label || status;
}
