"use client";

import { useMemo, useState } from "react";
import { Calculator, Clipboard, Download, ExternalLink, MapPin, RefreshCw, Truck, XCircle } from "lucide-react";

type Shipment = {
  id: string;
  provider_id: string | null;
  provider_service_id: string | null;
  service_name: string | null;
  rate_uuid: string | null;
  trx_id: string | null;
  guide_id: string | null;
  tracking_id: string | null;
  tracking_link: string | null;
  shipping_cost: number | null;
  status: string;
};

export type ShippingAdminOrder = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_whatsapp: string;
  product_name: string;
  size: string;
  quantity: number;
  total_mxn: number;
  status: string;
  address_city: string;
  address_state: string;
  notes: string | null;
  shipping_status?: string | null;
  tracking_id?: string | null;
  tracking_link?: string | null;
  shipping_provider?: string | null;
  shipping_cost_real?: number | null;
  shipments?: Shipment[];
};

type RateCard = {
  provider?: string;
  provider_id?: string;
  service?: string;
  service_name?: string;
  provider_service_id?: string;
  transport_type?: string;
  subtotal?: number;
  iva?: number;
  total?: number;
  estimated_date?: string;
  uuid?: string;
};

const DEFAULT_PACKAGE = {
  height: 5,
  width: 28,
  length: 34,
  weight: 0.45,
  package_content: "Playeras OVRLMT",
  product_type: "01010101",
  unit_type: "X1A",
  quantity: 1,
  shipping_type: "package",
};

function money(value: unknown) {
  return `$${Number(value || 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })} MXN`;
}

function pickRates(data: unknown): RateCard[] {
  const value = data as { rates?: RateCard[]; data?: { rates?: RateCard[] } };
  return Array.isArray(value?.rates) ? value.rates : Array.isArray(value?.data?.rates) ? value.data.rates : [];
}

function zipColonies(data: unknown): string[] {
  const value = data as { neighborhoods?: string[]; data?: { neighborhoods?: string[]; colonias?: string[] }; colonias?: string[] };
  return value.neighborhoods || value.colonias || value.data?.neighborhoods || value.data?.colonias || [];
}

export function AdminShippingPanel({ orders, getToken, reloadOrders }: { orders: ShippingAdminOrder[]; getToken: () => Promise<string | null>; reloadOrders: () => Promise<void> }) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || "");
  const [zip, setZip] = useState("");
  const [zipResult, setZipResult] = useState<unknown>(null);
  const [colony, setColony] = useState("");
  const [balance, setBalance] = useState<unknown>(null);
  const [rates, setRates] = useState<RateCard[]>([]);
  const [packageForm, setPackageForm] = useState(DEFAULT_PACKAGE);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

  const selected = useMemo(() => orders.find((order) => order.id === selectedOrderId) || orders[0], [orders, selectedOrderId]);
  const latestShipment = selected?.shipments?.[0];
  const readyOrders = orders.filter((order) => ["payment_validated", "ready_to_ship"].includes(order.status));

  async function adminFetch(path: string, init?: RequestInit) {
    const token = await getToken();
    if (!token) throw new Error("Sesión admin inválida.");
    const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
    const json = await response.json();
    if (!response.ok || json.ok === false) throw new Error(json.message || "No pudimos completar la acción.");
    return json;
  }

  async function refreshBalance() {
    setLoading("balance");
    setMessage("");
    try {
      setBalance(await adminFetch("/api/admin/enviatodo/balance"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos consultar balance.");
    } finally {
      setLoading("");
    }
  }

  async function validateZip() {
    if (!/^\d{5}$/.test(zip)) {
      setMessage("Escribe un CP de 5 dígitos.");
      return;
    }
    setLoading("zip");
    setMessage("");
    try {
      const result = await adminFetch(`/api/admin/enviatodo/zip-code?zip=${zip}`);
      setZipResult(result.data);
      setColony(zipColonies(result.data)[0] || "");
      if (result.message) setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos validar CP.");
    } finally {
      setLoading("");
    }
  }

  async function quote() {
    if (!selected) return;
    setLoading("quote");
    setMessage("");
    setRates([]);
    try {
      const payload = {
        shipment: {
          ...packageForm,
          order_number: selected.order_code,
          declared_value: selected.total_mxn,
          destination: {
            zip_code: zip,
            colony,
            city: selected.address_city,
            state: selected.address_state,
            contact_name: selected.customer_name,
            phone: selected.customer_whatsapp,
          },
        },
      };
      const result = await adminFetch("/api/admin/enviatodo/rates", { method: "POST", body: JSON.stringify({ orderId: selected.id, payload }) });
      setRates(pickRates(result.data));
      if (result.message) setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos cotizar.");
    } finally {
      setLoading("");
    }
  }

  async function createGuide(rate: RateCard, force = false) {
    if (!selected) return;
    setLoading(`create-${rate.uuid}`);
    setMessage("");
    try {
      await adminFetch("/api/admin/enviatodo/create-order", {
        method: "POST",
        body: JSON.stringify({
          orderId: selected.id,
          quoteUuid: rate.uuid,
          providerId: rate.provider_id,
          providerServiceId: rate.provider_service_id,
          serviceName: rate.service || rate.service_name,
          shippingCost: rate.total,
          force,
        }),
      });
      setMessage("Guía generada con EnviaTodo.");
      await reloadOrders();
    } catch (error) {
      const text = error instanceof Error ? error.message : "No pudimos crear la guía.";
      if (text.includes("ya tiene una guía") && window.confirm(`${text} ¿Crear otra guía de todos modos?`)) {
        await createGuide(rate, true);
        return;
      }
      setMessage(text);
    } finally {
      setLoading("");
    }
  }

  async function downloadGuide() {
    const guideId = latestShipment?.guide_id;
    if (!guideId) {
      setMessage("Este pedido no tiene guide_id guardado.");
      return;
    }
    setLoading("download");
    setMessage("");
    try {
      const result = await adminFetch("/api/admin/enviatodo/download-guide", { method: "POST", body: JSON.stringify({ guideIds: [guideId] }) });
      const guide = result.data?.guides?.[0] || result.data?.data?.guides?.[0];
      const base64 = guide?.file_base64 || guide?.base64 || guide?.content;
      if (!base64) throw new Error("EnviaTodo no devolvió PDF en base64.");
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${base64}`;
      link.download = guide?.file_name || `${selected?.order_code || "ovrlmt"}-guia.pdf`;
      link.click();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos descargar la guía.");
    } finally {
      setLoading("");
    }
  }

  async function cancelGuide() {
    if (!selected || !latestShipment?.tracking_id) return;
    const reason = window.prompt("Razón de cancelación");
    if (!reason) return;
    if (!window.confirm("Cancelar esta guía? El pedido no se borrará.")) return;
    setLoading("cancel");
    setMessage("");
    try {
      await adminFetch("/api/admin/enviatodo/cancel-order", { method: "POST", body: JSON.stringify({ orderId: selected.id, trackingIds: [latestShipment.tracking_id], reason, orderType: "shipment" }) });
      setMessage("Guía cancelada.");
      await reloadOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos cancelar la guía.");
    } finally {
      setLoading("");
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setMessage("Copiado.");
  }

  const whatsappMessage = selected && (selected.tracking_id || latestShipment?.tracking_id)
    ? `Hola ${selected.customer_name}, tu pedido OVRLMT #${selected.order_code} ya tiene guía. Tu número de rastreo es ${selected.tracking_id || latestShipment?.tracking_id}. Puedes seguirlo aquí: ${selected.tracking_link || latestShipment?.tracking_link || ""}.`
    : "";

  return <div className="shipping-admin">
    {message ? <p className="preorder-error">{message}</p> : null}
    <div className="shipping-admin-top">
      <section className="shipping-widget">
        <div><span>BALANCE ENVIATODO</span><strong>{money((balance as { data?: { balance?: number } } | null)?.data?.balance)}</strong></div>
        <button onClick={refreshBalance} disabled={loading === "balance"}><RefreshCw size={14} /> ACTUALIZAR BALANCE</button>
      </section>
      <section className="shipping-widget">
        <label><span>VALIDAR CÓDIGO POSTAL</span><input value={zip} onChange={(event) => setZip(event.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="72000" /></label>
        <button onClick={validateZip} disabled={loading === "zip"}><MapPin size={14} /> VALIDAR</button>
      </section>
    </div>

    {zipResult ? <div className="zip-result">
      <span>{String((zipResult as { municipality?: string; city?: string; state?: string }).municipality || "")}</span>
      <span>{String((zipResult as { city?: string }).city || "")}</span>
      <span>{String((zipResult as { state?: string }).state || "")}</span>
      <select value={colony} onChange={(event) => setColony(event.target.value)}>{zipColonies(zipResult).map((item) => <option key={item}>{item}</option>)}</select>
    </div> : null}

    <div className="shipping-layout">
      <aside className="shipping-orders">
        {readyOrders.map((order) => <button key={order.id} className={selected?.id === order.id ? "active" : ""} onClick={() => setSelectedOrderId(order.id)}>
          <span>{order.shipping_status || "Sin guía"}</span>
          <strong>{order.order_code}</strong>
          <small>{order.customer_name} / {money(order.total_mxn)}</small>
        </button>)}
      </aside>
      <section className="shipping-detail">
        {selected ? <>
          <header><div><span>{selected.status}</span><h2>{selected.customer_name}</h2><p>{selected.product_name} / {selected.quantity}x / talla {selected.size}</p></div><strong>{selected.order_code}</strong></header>
          <div className="shipping-badges"><span>{selected.shipping_status || "Sin guía"}</span>{latestShipment?.tracking_id ? <span>{latestShipment.tracking_id}</span> : null}</div>
          <div className="package-form">
            {(["height", "width", "length", "weight"] as const).map((key) => <label key={key}><span>{key === "height" ? "ALTO CM" : key === "width" ? "ANCHO CM" : key === "length" ? "LARGO CM" : "PESO KG"}</span><input type="number" step="0.01" value={packageForm[key]} onChange={(event) => setPackageForm({ ...packageForm, [key]: Number(event.target.value) })} /></label>)}
            <label><span>CONTENIDO</span><input value={packageForm.package_content} onChange={(event) => setPackageForm({ ...packageForm, package_content: event.target.value })} /></label>
            <label><span>VALOR</span><input type="number" value={selected.total_mxn} readOnly /></label>
          </div>
          <button className="submit-btn" onClick={quote} disabled={loading === "quote" || !zip}><span>{loading === "quote" ? "COTIZANDO" : "COTIZAR ENVÍO"}</span><Calculator size={16} /></button>
          <div className="rate-grid">{rates.map((rate) => <article key={rate.uuid || `${rate.provider_id}-${rate.provider_service_id}`}>
            <span>{rate.provider || "Paquetería"}</span><h3>{rate.service || rate.service_name || "Servicio"}</h3><p>{rate.transport_type || "Transporte"} / {rate.estimated_date || "Fecha por confirmar"}</p>
            <dl><div><dt>Subtotal</dt><dd>{money(rate.subtotal)}</dd></div><div><dt>IVA</dt><dd>{money(rate.iva)}</dd></div><div><dt>Total</dt><dd>{money(rate.total)}</dd></div><div><dt>provider_id</dt><dd>{rate.provider_id}</dd></div><div><dt>service_id</dt><dd>{rate.provider_service_id}</dd></div><div><dt>uuid</dt><dd>{rate.uuid}</dd></div></dl>
            <button onClick={() => createGuide(rate)} disabled={loading === `create-${rate.uuid}`}>CREAR GUÍA CON ESTA OPCIÓN</button>
          </article>)}</div>
          <div className="shipping-actions">
            <button onClick={downloadGuide} disabled={!latestShipment?.guide_id || loading === "download"}><Download size={14} /> DESCARGAR GUÍA PDF</button>
            <button onClick={cancelGuide} disabled={!latestShipment?.tracking_id || loading === "cancel"}><XCircle size={14} /> CANCELAR GUÍA</button>
            <button onClick={() => copy(latestShipment?.tracking_id || selected.tracking_id || "")} disabled={!latestShipment?.tracking_id && !selected.tracking_id}><Clipboard size={14} /> COPIAR TRACKING</button>
            <button onClick={() => copy(whatsappMessage)} disabled={!whatsappMessage}><Clipboard size={14} /> COPIAR WHATSAPP</button>
            {(latestShipment?.tracking_link || selected.tracking_link) ? <a href={latestShipment?.tracking_link || selected.tracking_link || ""} target="_blank" rel="noreferrer"><ExternalLink size={14} /> ABRIR TRACKING</a> : null}
          </div>
        </> : <p>No hay pedidos pagados/listos para enviar.</p>}
      </section>
    </div>
  </div>;
}
