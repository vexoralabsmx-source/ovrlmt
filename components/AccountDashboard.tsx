"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, PackageCheck, RefreshCw, Repeat2, Star } from "lucide-react";
import { useCart, type CartItem } from "@/components/CartProvider";
import { getOrderStatusLabel } from "@/src/lib/orderStatus";
import { ADMIN_EMAIL } from "@/src/lib/authConfig";
import { clearBrowserSession, getBrowserSession } from "@/src/lib/sessionStorage";
import type { ProductSize } from "@/data/store";

type OrderItem = { slug: string; name: string; size: ProductSize; quantity: number; unitPriceMxn: number };
type CustomerOrder = {
  id: string;
  order_code: string;
  product_slug: string;
  product_name: string;
  size: string;
  quantity: number;
  subtotal_mxn: number;
  discount_mxn: number;
  shipping_mxn: number;
  total_mxn: number;
  status: string;
  production_status?: string | null;
  payment_status?: string | null;
  payment_receipt_no?: string | null;
  tracking_id?: string | null;
  tracking_link?: string | null;
  items?: OrderItem[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const money = (value: number) => `$${Number(value).toLocaleString("es-MX")} MXN`;
const productionSteps = ["received", "printing", "quality", "packing", "ready", "shipped"];
const productionLabels: Record<string, string> = {
  received: "Recibido", printing: "Impresión", quality: "Calidad", packing: "Empaque", ready: "Listo", shipped: "Enviado",
};

export function AccountDashboard() {
  const router = useRouter();
  const cart = useCart();
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [reviewOrder, setReviewOrder] = useState<CustomerOrder | null>(null);
  const [changeOrder, setChangeOrder] = useState<CustomerOrder | null>(null);
  const [saving, setSaving] = useState(false);

  function sessionToken() {
    return getBrowserSession()?.accessToken || "";
  }

  async function loadOrders() {
    setLoading(true);
    const session = getBrowserSession();
    const token = session?.accessToken;
    const userEmail = session?.email.toLowerCase();
    if (!token || !userEmail) return void router.replace("/login?next=/cuenta");
    if (userEmail === ADMIN_EMAIL) return void router.replace("/admin");
    setEmail(userEmail);
    const response = await fetch("/api/account/orders", { headers: { Authorization: `Bearer ${token}` } });
    const json = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(json.message || "No pudimos cargar tus pedidos.");
    setOrders(json.orders || []);
  }

  useEffect(() => { void loadOrders(); }, []);

  function signOut() {
    clearBrowserSession();
    router.replace("/login");
  }

  function repeatOrder(order: CustomerOrder) {
    const fallbackSlugs = order.product_slug.split(",");
    const nextItems: CartItem[] = (order.items?.length ? order.items : fallbackSlugs.map((slug) => ({
      slug, name: order.product_name, size: order.size as ProductSize, quantity: order.quantity, unitPriceMxn: Math.round(order.subtotal_mxn / order.quantity),
    }))).map((item) => ({
      slug: item.slug,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      priceMxn: item.unitPriceMxn,
      image: "/brand/ovrlmt-logo.png",
    }));
    cart.replaceItems(nextItems);
    router.push("/cart");
  }

  async function downloadReceipt(order: CustomerOrder) {
    const response = await fetch(`/api/account/orders/${order.id}/receipt`, { headers: { Authorization: `Bearer ${sessionToken()}` } });
    if (!response.ok) return setMessage("No pudimos descargar el comprobante.");
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${order.order_code}-comprobante.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewOrder) return;
    setSaving(true);
    const form = new FormData(event.currentTarget);
    form.set("preorderId", reviewOrder.id);
    form.set("productSlug", reviewOrder.items?.[0]?.slug || reviewOrder.product_slug.split(",")[0]);
    const response = await fetch("/api/account/reviews", { method: "POST", headers: { Authorization: `Bearer ${sessionToken()}` }, body: form });
    const json = await response.json();
    setSaving(false);
    setMessage(json.message || json.error || "");
    if (response.ok) setReviewOrder(null);
  }

  async function submitChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!changeOrder) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    const response = await fetch("/api/account/changes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken()}` },
      body: JSON.stringify({ preorderId: changeOrder.id, requestedSize: form.get("requestedSize"), reason: form.get("reason") }),
    });
    const json = await response.json();
    setSaving(false);
    setMessage(json.message || json.error || "");
    if (response.ok) setChangeOrder(null);
  }

  return (
    <section className="account-page">
      <header>
        <div><p className="eyebrow"><i /> MI CUENTA</p><h1>Tus pedidos.</h1></div>
        <div className="account-actions">
          <button onClick={loadOrders} disabled={loading}><RefreshCw size={15} /> ACTUALIZAR</button>
          <button onClick={signOut}>CERRAR SESIÓN</button>
        </div>
      </header>
      <p className="account-email">{email}</p>
      {message && <p className="account-notice" role="status">{message}</p>}
      {loading ? <div className="orders-empty">CARGANDO PEDIDOS</div> : orders.length === 0 ? (
        <div className="orders-empty"><PackageCheck size={28} /><p>No encontramos pedidos con este correo.</p><Link className="btn primary" href="/drop">VER DROP</Link></div>
      ) : (
        <div className="orders-list account-orders-rich">
          {orders.map((order) => {
            const currentStep = Math.max(0, productionSteps.indexOf(order.production_status || "received"));
            return (
              <article key={order.id}>
                <div><span>{order.order_code}</span><h2>{order.product_name}</h2><p>{order.quantity}x / TALLA {order.size}</p></div>
                <div><span>ESTADO</span><strong>{getOrderStatusLabel(order.status)}</strong><p>{order.notes || "Sin notas nuevas por ahora."}</p></div>
                <div><span>TOTAL</span><strong>{money(order.total_mxn)}</strong><p>Actualizado {new Date(order.updated_at).toLocaleDateString("es-MX")}</p></div>
                <div className="production-timeline" aria-label="Progreso de producción">
                  {productionSteps.map((item, index) => <span className={index <= currentStep ? "done" : ""} key={item}>{productionLabels[item]}</span>)}
                </div>
                {order.tracking_link && <a className="account-tracking" href={order.tracking_link} target="_blank" rel="noreferrer">SEGUIR ENVÍO {order.tracking_id || ""} ↗</a>}
                <div className="account-order-actions">
                  <button onClick={() => repeatOrder(order)}><Repeat2 size={15} /> REPETIR PEDIDO</button>
                  <button onClick={() => void downloadReceipt(order)}><Download size={15} /> COMPROBANTE</button>
                  {order.status === "delivered" && <button onClick={() => setReviewOrder(order)}><Star size={15} /> RESEÑAR</button>}
                  {["payment_validated", "in_production", "ready_to_ship", "delivered"].includes(order.status) && <button onClick={() => setChangeOrder(order)}>CAMBIO DE TALLA</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {reviewOrder && (
        <div className="account-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <form onSubmit={submitReview}>
            <button className="modal-close" type="button" onClick={() => setReviewOrder(null)} aria-label="Cerrar">×</button>
            <p className="eyebrow">COMPRA VERIFICADA</p><h2 id="review-title">Cuenta tu experiencia.</h2>
            <label><span>ESTRELLAS *</span><select name="rating" required defaultValue="5"><option value="5">5 — Excelente</option><option value="4">4 — Muy buena</option><option value="3">3 — Buena</option><option value="2">2 — Regular</option><option value="1">1 — Mala</option></select></label>
            <label><span>NOMBRE PÚBLICO (OPCIONAL)</span><input name="displayName" maxLength={60} placeholder="Déjalo vacío para publicar como Anónimo" /></label>
            <label><span>TÍTULO (OPCIONAL)</span><input name="title" maxLength={100} /></label>
            <label><span>RESEÑA *</span><textarea name="body" required minLength={10} maxLength={1200} rows={5} /></label>
            <label><span>FOTOS (OPCIONAL, MÁX. 3)</span><input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>
            <button className="submit-btn" disabled={saving}>{saving ? "ENVIANDO..." : "ENVIAR RESEÑA"}</button>
          </form>
        </div>
      )}

      {changeOrder && (
        <div className="account-modal" role="dialog" aria-modal="true" aria-labelledby="change-title">
          <form onSubmit={submitChange}>
            <button className="modal-close" type="button" onClick={() => setChangeOrder(null)} aria-label="Cerrar">×</button>
            <p className="eyebrow">SOLICITUD / {changeOrder.order_code}</p><h2 id="change-title">Cambio de talla.</h2>
            <label><span>NUEVA TALLA *</span><select name="requestedSize" required><option>CH</option><option>M</option><option>G</option><option>XG</option></select></label>
            <label><span>MOTIVO *</span><textarea name="reason" required minLength={5} maxLength={600} rows={5} /></label>
            <button className="submit-btn" disabled={saving}>{saving ? "ENVIANDO..." : "SOLICITAR CAMBIO"}</button>
          </form>
        </div>
      )}
    </section>
  );
}
