import { getUserFromRequest } from "@/src/lib/authServer";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
}[character] || character));

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return new Response(auth.message, { status: auth.status });
  const { id } = await context.params;
  const { data: order } = await getSupabaseAdmin()
    .from("preorders")
    .select("order_code,customer_name,customer_email,product_name,size,quantity,subtotal_mxn,discount_mxn,shipping_mxn,total_mxn,status,payment_provider,payment_receipt_no,created_at")
    .eq("id", id)
    .eq("customer_email", auth.user.email?.toLowerCase())
    .maybeSingle();
  if (!order) return new Response("Pedido no encontrado.", { status: 404 });
  const money = (value: unknown) => `$${Number(value || 0).toLocaleString("es-MX")} MXN`;
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>${escapeHtml(order.order_code)}</title>
  <body style="font-family:Arial;max-width:720px;margin:40px auto;padding:24px;color:#111">
  <h1>OVRLMT</h1><p>Comprobante de pedido</p><hr>
  <h2>${escapeHtml(order.order_code)}</h2>
  <p>Fecha: ${new Date(order.created_at).toLocaleDateString("es-MX")}</p>
  <p>Cliente: ${escapeHtml(order.customer_name)} · ${escapeHtml(order.customer_email)}</p>
  <p>Producto: ${escapeHtml(order.product_name)} · Talla ${escapeHtml(order.size)} · ${escapeHtml(order.quantity)} pieza(s)</p>
  <p>Subtotal: ${money(order.subtotal_mxn)}<br>Descuento: ${money(order.discount_mxn)}<br>Envío: ${money(order.shipping_mxn)}</p>
  <h3>Total: ${money(order.total_mxn)}</h3>
  <p>Estado: ${escapeHtml(order.status)} · Pago: ${escapeHtml(order.payment_provider || "manual")} ${escapeHtml(order.payment_receipt_no || "")}</p>
  <p style="margin-top:50px;color:#666">Guarda este archivo o ábrelo e imprime como PDF.</p></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${order.order_code}-comprobante.html"`,
    },
  });
}
