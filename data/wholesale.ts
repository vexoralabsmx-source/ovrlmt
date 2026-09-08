export const MAX_ITEM_QUANTITY = 500;
export type WholesaleRule = { id: string; product_slug: string; min_quantity: number; discount_type: "fixed" | "percent"; discount_value: number; active: boolean };
export type WholesaleItem = { slug: string; quantity: number; priceMxn: number };
const cents = (value: number) => Math.round(value * 100);
export function validateWholesaleRule(value: unknown): Omit<WholesaleRule, "id"> {
  if (!value || typeof value !== "object") throw new Error("Completa los datos del escalón.");
  const r = value as Record<string, unknown>;
  if (typeof r.product_slug !== "string" || !/^[a-z0-9-]{1,160}$/.test(r.product_slug)) throw new Error("Selecciona un modelo válido.");
  if (!Number.isInteger(r.min_quantity) || Number(r.min_quantity) < 2 || Number(r.min_quantity) > MAX_ITEM_QUANTITY) throw new Error("El mínimo debe ser de 2 a 500 piezas del mismo modelo.");
  if (r.discount_type !== "fixed" && r.discount_type !== "percent") throw new Error("Selecciona pesos por pieza o porcentaje.");
  if (typeof r.discount_value !== "number" || !Number.isFinite(r.discount_value) || r.discount_value <= 0 || r.discount_value > (r.discount_type === "percent" ? 99 : 100000) || Math.abs(cents(r.discount_value) / 100 - r.discount_value) > 0.000001) throw new Error("Indica un descuento positivo con máximo dos decimales (porcentaje menor a 100).");
  if (typeof r.active !== "boolean") throw new Error("Indica si el escalón está activo.");
  return { product_slug: r.product_slug, min_quantity: Number(r.min_quantity), discount_type: r.discount_type, discount_value: r.discount_value, active: r.active };
}
export function calculateWholesale(items: WholesaleItem[], rules: WholesaleRule[]) {
  const quantities = new Map<string, number>();
  for (const item of items) quantities.set(item.slug, (quantities.get(item.slug) || 0) + item.quantity);
  const lines = items.map(item => {
    let discountCents = 0;
    let rule: WholesaleRule | null = null;
    for (const candidate of rules) {
      if (!candidate.active || candidate.product_slug !== item.slug || candidate.min_quantity > (quantities.get(item.slug) || 0)) continue;
      const unitDiscount = candidate.discount_type === "fixed" ? cents(candidate.discount_value) : Math.round(cents(item.priceMxn) * candidate.discount_value / 100);
      const amount = Math.max(0, Math.min(cents(item.priceMxn) - 1, unitDiscount)) * item.quantity;
      if (amount > discountCents) { discountCents = amount; rule = candidate; }
    }
    return { slug: item.slug, quantity: item.quantity, discountMxn: discountCents / 100, rule };
  });
  return { discountMxn: lines.reduce((sum, line) => sum + cents(line.discountMxn), 0) / 100, lines };
}
export function chooseDiscount(wholesale: number, coupon: number) {
  return { discountMxn: Math.max(wholesale, coupon), wholesaleApplied: wholesale > 0 && wholesale >= coupon };
}
