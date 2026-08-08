"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { BadgePercent, Save, Search, TicketPercent, Trash2 } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  active: boolean;
  max_uses: number | null;
  used_count: number;
  created_at: string;
};

type CouponForm = {
  id?: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  maxUses: number;
  active: boolean;
};

const emptyForm = (): CouponForm => ({ code: "", type: "percent", value: 10, maxUses: 0, active: true });

function couponLabel(coupon: Pick<Coupon, "type" | "value">) {
  return coupon.type === "percent"
    ? `${Number(coupon.value)}%`
    : `$${Number(coupon.value).toLocaleString("es-MX")} MXN`;
}

export function AdminCouponsPanel({ getToken }: { getToken: () => Promise<string | null> }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredCoupons = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return coupons;
    return coupons.filter((coupon) => [coupon.code, coupon.type, coupon.active ? "activo" : "pausado"].join(" ").toLowerCase().includes(normalized));
  }, [coupons, query]);

  async function load() {
    const token = await getToken();
    if (!token) return;
    const response = await fetch("/api/admin/coupons", { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (response.ok) setCoupons(result.coupons || []);
    else setMessage(result.error || "No pudimos cargar cupones.");
  }

  useEffect(() => { void load(); }, []);

  function chooseCoupon(coupon: Coupon) {
    setForm({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value || 0),
      maxUses: Number(coupon.max_uses || 0),
      active: Boolean(coupon.active),
    });
    setMessage("");
  }

  async function saveCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await getToken();
    if (!token) return;
    const code = form.code.trim().toUpperCase();
    if (!code || form.value <= 0 || (form.type === "percent" && form.value > 100)) {
      setMessage("Revisa código, tipo y descuento.");
      return;
    }
    setSaving(true);
    const response = await fetch("/api/admin/coupons", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, code }),
    });
    const result = await response.json();
    setSaving(false);
    setMessage(response.ok ? (form.id ? "Cupón actualizado." : "Cupón creado.") : result.error || "No pudimos guardar.");
    if (response.ok) {
      setForm(emptyForm());
      await load();
    }
  }

  async function deleteCoupon() {
    const token = await getToken();
    if (!token || !form.id) return;
    if (!window.confirm("Eliminar este cupón?")) return;
    setSaving(true);
    const response = await fetch(`/api/admin/coupons?id=${encodeURIComponent(form.id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    setSaving(false);
    setMessage(response.ok ? "Cupón eliminado." : result.error || "No pudimos eliminar.");
    if (response.ok) {
      setForm(emptyForm());
      await load();
    }
  }

  return (
    <div className="admin-grid coupons-admin-grid">
      <div className="admin-orders coupon-admin-list">
        <div className="admin-list-tools">
          <label><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cupón..." /></label>
          <button type="button" onClick={() => setForm(emptyForm())}><TicketPercent size={14} /> NUEVO CUPÓN</button>
        </div>
        {filteredCoupons.map((coupon) => {
          const remaining = coupon.max_uses === null ? "Sin límite" : `${Math.max(0, Number(coupon.max_uses) - Number(coupon.used_count || 0))} restantes`;
          return (
            <button key={coupon.id} className={form.id === coupon.id ? "active" : ""} onClick={() => chooseCoupon(coupon)}>
              <span>{coupon.active ? "ACTIVO" : "PAUSADO"} / {couponLabel(coupon)}</span>
              <strong>{coupon.code}</strong>
              <small>{Number(coupon.used_count || 0)} usados · {remaining}</small>
            </button>
          );
        })}
        {!filteredCoupons.length && <p className="admin-empty-state">No hay cupones con esos filtros.</p>}
      </div>

      <form className="admin-editor coupon-editor" onSubmit={saveCoupon}>
        <div className="admin-editor-head">
          <div>
            <span>{form.id ? "EDITAR CUPÓN" : "NUEVO CUPÓN"}</span>
            <h2>{form.code || "Cupón"}</h2>
            <p>Define si descuenta porcentaje o dinero fijo, cuántos usos permite y si queda activo en checkout.</p>
          </div>
          <BadgePercent />
        </div>
        <div className="coupon-preview">
          <span>{form.active ? "ACTIVO EN CHECKOUT" : "PAUSADO"}</span>
          <strong>{form.code || "OVRLMT10"}</strong>
          <p>{couponLabel(form)} de descuento · {form.maxUses > 0 ? `${form.maxUses} usos máximos` : "sin límite de usos"}</p>
        </div>
        <div className="product-form-grid">
          <label><span>CÓDIGO</span><input value={form.code} maxLength={60} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} placeholder="WELCOME10" /></label>
          <label><span>TIPO</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as CouponForm["type"], value: event.target.value === "percent" ? Math.min(form.value || 10, 100) : form.value })}><option value="percent">Porcentaje</option><option value="fixed">Dinero fijo MXN</option></select></label>
          <label><span>{form.type === "percent" ? "PORCENTAJE" : "DESCUENTO MXN"}</span><input type="number" min="1" max={form.type === "percent" ? 100 : undefined} value={form.value} onChange={(event) => setForm({ ...form, value: Math.max(0, Number(event.target.value) || 0) })} /></label>
          <label><span>USOS MÁXIMOS</span><input type="number" min="0" value={form.maxUses} onChange={(event) => setForm({ ...form, maxUses: Math.max(0, Number(event.target.value) || 0) })} /><small>0 significa sin límite.</small></label>
          <label className="send-toggle"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Cupón activo</label>
        </div>
        <div className="coupon-actions">
          {form.id && <button className="danger-icon" type="button" onClick={deleteCoupon} disabled={saving}><Trash2 size={17} /> ELIMINAR</button>}
          <button className="submit-btn" type="submit" disabled={saving}><span>{saving ? "GUARDANDO" : "GUARDAR CUPÓN"}</span><Save size={16} /></button>
        </div>
        {message && <p className="account-notice">{message}</p>}
      </form>
    </div>
  );
}
