import "server-only";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";
import { calculateWholesale, type WholesaleItem, type WholesaleRule } from "@/data/wholesale";
export async function readWholesaleRules() {
  const { data, error } = await getSupabaseAdmin().from("wholesale_rules").select("id,product_slug,min_quantity,discount_type,discount_value,active").order("min_quantity");
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return { rules: [] as WholesaleRule[], configured: false };
    throw new Error("No pudimos verificar el mayoreo. Intenta nuevamente.");
  }
  return { rules: (data || []) as WholesaleRule[], configured: true };
}
export async function getWholesaleDiscount(items: WholesaleItem[]) {
  const { rules } = await readWholesaleRules();
  return calculateWholesale(items, rules);
}
