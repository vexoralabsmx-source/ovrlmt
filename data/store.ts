export const PRODUCT_PRICE = 359;
export const SHIPPING_COST = 150;
export const FREE_SHIPPING_MINIMUM = 1500;
export const WHATSAPP_NUMBER = "522212683069";
export const DISCOUNT_CODE = "OVRLMT-10FFDP1";
export const DISCOUNT_RATE = 0.1;
export const PRODUCT_MATERIAL = "100% algodón / 190 g/m2";
export const LOCAL_DELIVERY_AREA = "Puebla Centro y alrededores";
export const LOCAL_DELIVERY_COPY = "Entrega personal gratis en Puebla Centro y alrededores. Ingresa tu código postal en checkout para confirmar si aplica.";
export const PAYMENT_DETAILS = {
  accountHolder: "Miguel Ángel Dorantes Hernández",
  bank: "BBVA",
  account: "4152 3146 1191 9765",
  instructions: "Incluye tu nombre completo como concepto y conserva tu comprobante.",
} as const;

// Puebla de Zaragoza y corredor metropolitano cercano a Cholula–Angelópolis.
// La entrega personal siempre queda sujeta a confirmación de zona, punto y horario.
export const LOCAL_DELIVERY_POSTAL_CODE_RANGES = [
  [72000, 72599],
  [72700, 72899],
] as const;

export function isFreePersonalDeliveryPostalCode(postalCode: string) {
  const normalized = postalCode.replace(/\D/g, "");
  if (normalized.length !== 5) return false;
  const value = Number(normalized);
  return LOCAL_DELIVERY_POSTAL_CODE_RANGES.some(([minimum, maximum]) => value >= minimum && value <= maximum);
}

export const SIZES = ["CH", "M", "G", "XG"] as const;
export type ProductSize = (typeof SIZES)[number];

export const SIZE_EQUIVALENCE: Record<ProductSize, string> = {
  CH: "S",
  M: "M",
  G: "L",
  XG: "XL",
};
