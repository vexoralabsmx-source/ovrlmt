import "server-only";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

export type CouponResult = {
  code: string;
  discountMxn: number;
  label: string;
};

export async function validateCoupon(code: string, subtotalMxn: number, customerEmail: string): Promise<CouponResult> {
  const normalized = code.trim().toUpperCase().slice(0, 60);
  if (!normalized) throw new Error("Escribe un cupón.");
  const supabase = getSupabaseAdmin();
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("code,type,value,active,max_uses,used_count,minimum_subtotal_mxn,first_order_only,starts_at,ends_at")
    .eq("code", normalized)
    .maybeSingle();
  if (error || !coupon?.active) throw new Error("El cupón no existe o está desactivado.");

  const now = Date.now();
  if (coupon.max_uses !== null && Number(coupon.used_count) >= Number(coupon.max_uses)) throw new Error("Este cupón llegó a su límite.");
  if (subtotalMxn < Number(coupon.minimum_subtotal_mxn || 0)) throw new Error(`Compra mínima: $${Number(coupon.minimum_subtotal_mxn).toLocaleString("es-MX")} MXN.`);
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) throw new Error("Este cupón todavía no está activo.");
  if (coupon.ends_at && new Date(coupon.ends_at).getTime() < now) throw new Error("Este cupón ya venció.");
  if (coupon.first_order_only) {
    const { count } = await supabase
      .from("preorders")
      .select("id", { count: "exact", head: true })
      .eq("customer_email", customerEmail.toLowerCase())
      .neq("status", "cancelled");
    if (Number(count || 0) > 0) throw new Error("Este cupón es exclusivo para primera compra.");
  }

  const discountMxn = coupon.type === "percent"
    ? Math.round(subtotalMxn * Number(coupon.value) / 100)
    : Math.min(subtotalMxn, Math.round(Number(coupon.value)));
  return {
    code: coupon.code,
    discountMxn,
    label: coupon.type === "percent" ? `${Number(coupon.value)}% de descuento` : `$${Number(coupon.value).toLocaleString("es-MX")} MXN de descuento`,
  };
}

export async function incrementCouponUse(code: string | null) {
  if (!code) return;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("coupons").select("used_count").eq("code", code).single();
  await supabase.from("coupons").update({ used_count: Number(data?.used_count || 0) + 1 }).eq("code", code);
}
