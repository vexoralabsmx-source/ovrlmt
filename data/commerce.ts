import type { Product } from "./products";
import {
  FREE_SHIPPING_MINIMUM,
  SHIPPING_COST,
  LOCAL_DELIVERY_COPY,
} from "./store";
export const CURRENT_DROP_URL = "/drop?categoria=actual";
export const DELIVERY = {
  production: "5–8 días hábiles",
  shipping: "2–5 días hábiles adicionales",
} as const;
export const DELIVERY_ESTIMATE = `Producción estimada: ${DELIVERY.production} después de confirmar el pago. Envío nacional: ${DELIVERY.shipping}. Los plazos son estimados y se confirman con tu pedido.`;
export const SHIPPING_COPY = `Envío nacional: $${SHIPPING_COST} MXN. Gratis desde $${FREE_SHIPPING_MINIMUM.toLocaleString("es-MX")} MXN después de descuentos.`;
export const POLICIES = {
  payment:
    "Paga con tarjeta mediante Clip o por transferencia. Clip confirma el pago automáticamente; las transferencias se confirman al validar el comprobante.",
  sizes:
    "Solicita una corrección de talla desde tu cuenta o por WhatsApp. Se revisa según la etapa de producción y disponibilidad; la solicitud no garantiza el cambio.",
  defects:
    "Si detectas un defecto de producción, contáctanos por WhatsApp con fotos y tu número de pedido para revisar la solución correspondiente.",
  cancellations:
    "Solicita cualquier cancelación por WhatsApp indicando tu número de pedido. Revisaremos el estado de producción y las opciones aplicables a tu caso.",
} as const;
export const FAQ = [
  [
    "¿Cómo se produce mi pieza?",
    "La producción comienza después de confirmar tu pago. Consulta el estado de tu pedido desde tu cuenta.",
  ],
  ["¿Cómo puedo pagar?", POLICIES.payment],
  ["¿Cuánto tarda mi pedido?", DELIVERY_ESTIMATE],
  ["¿Cuánto cuesta el envío?", SHIPPING_COPY],
  ["¿Dónde entregan en Puebla?", LOCAL_DELIVERY_COPY],
  ["¿Puedo cambiar la talla?", POLICIES.sizes],
  ["¿Qué hago si mi pieza tiene un defecto?", POLICIES.defects],
  ["¿Puedo cancelar?", POLICIES.cancellations],
] as const;
export function publicProductSlug(slug: string) {
  return slug.replace(/^naomi-/, "nayiomi-");
}
export function internalProductSlug(slug: string) {
  return slug.replace(/^nayiomi-/, "naomi-");
}
export function productUrl(slug: string) {
  return `/drop/${publicProductSlug(slug)}`;
}
export function isCurrentDrop(product: Product) {
  return (
    product.drop.startsWith("004") || /^(naomi|nayiomi)-/.test(product.slug)
  );
}
export function garmentType(product: Product) {
  return /hoodie|sudadera/i.test(`${product.slug} ${product.details}`)
    ? "Sudadera"
    : /playera|tee/i.test(`${product.slug} ${product.details}`)
      ? "Playera"
      : "Prenda";
}
export function availabilityLabel(available: number, unlimited = false) {
  if (available <= 0) return "Agotado";
  return unlimited ? "Disponible sobre pedido" : "Disponible";
}
