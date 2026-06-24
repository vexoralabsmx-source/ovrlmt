export const PRODUCT_PRICE = 359;
export const SHIPPING_COST = 150;
export const FREE_SHIPPING_MINIMUM = 1500;
export const WHATSAPP_NUMBER = "522212693309";
export const BANK_NAME = "BBVA";
export const ACCOUNT_NAME = "Miguel Ángel Dorantes Hernández";
export const BANK_CARD = "4152 3146 1191 9765";

// Puebla capital y corredor Centro–Cholula–Angelópolis. La entrega presencial
// siempre queda sujeta a confirmación de zona, punto y horario con el vendedor.
export const LOCAL_DELIVERY_POSTAL_CODE_RANGES = [
  [72000, 72599],
  [72750, 72840],
] as const;

export function isLocalDeliveryPostalCode(postalCode: string) {
  const normalized = postalCode.replace(/\D/g, "");
  if (normalized.length !== 5) return false;
  const value = Number(normalized);
  return LOCAL_DELIVERY_POSTAL_CODE_RANGES.some(([min, max]) => value >= min && value <= max);
}

export const SIZES = ["CH", "M", "G", "XL"] as const;
export type ProductSize = (typeof SIZES)[number];
