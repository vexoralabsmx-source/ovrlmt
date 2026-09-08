"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Plus, Save, Trash2, Pencil, Package } from "lucide-react";
import { calculateWholesale, validateWholesaleRule, type WholesaleRule } from "@/data/wholesale";
type Product = { slug: string; name: string; priceMxn: number };
const empty = (): WholesaleRule => ({ id: "", product_slug: "", min_quantity: 6, discount_type: "fixed", discount_value: 30, active: false });
const money = (n: number) => `$${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;
export function AdminWholesalePanel({ getToken }: { getToken: () => Promise<string | null> }) {
  const [rules, setRules] = useState<WholesaleRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState("");
  async function load() {
    setLoading(true);
    try {
      const token = await getToken(); if (!token) return;
      const response = await fetch("/api/admin/wholesale", { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
      const json = await response.json(); if (!response.ok) throw new Error(json.message || "No pudimos cargar mayoreo.");
      setRules(json.rules); setProducts(json.products); setConfigured(json.configured);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos conectar."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function mutate(method: string, payload?: WholesaleRule, id?: string) {
    setSaving(true); setMessage("");
    try {
      const token = await getToken(); if (!token) return;
      const response = await fetch(`/api/admin/wholesale${id ? `?id=${id}` : ""}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: payload ? JSON.stringify(payload) : undefined, signal: AbortSignal.timeout(10000) });
      const json = await response.json(); if (!response.ok) throw new Error(json.message || "No se guardaron los cambios.");
      setForm(empty()); setDeleteId(""); await load(); setMessage(method === "DELETE" ? "Escalón eliminado." : "Escalón guardado. Los precios ya reflejan tu configuración.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos guardar."); }
    finally { setSaving(false); }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    try { validateWholesaleRule(form); } catch (error) { setMessage((error as Error).message); return; }
    void mutate(form.id ? "PATCH" : "POST", form);
  }
  const product = products.find(p => p.slug === form.product_slug);
  const preview = product ? calculateWholesale([{ slug: product.slug, priceMxn: product.priceMxn, quantity: form.min_quantity || 1 }], [{ ...form, active: true }]) : null;
  const visible = rules.filter(r => `${products.find(p => p.slug === r.product_slug)?.name || r.product_slug}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="wholesale-panel" aria-label="Configuración de mayoreo">
    <header className="admin-section-heading"><div><p className="section-label">PRECIOS POR VOLUMEN</p><h2>Mayoreo por modelo</h2><p>Tú eliges desde cuántas piezas y cuánto baja cada una. Las tallas del mismo modelo se suman.</p></div><span className="admin-status-chip">{rules.filter(r => r.active).length} escalones activos</span></header>
    <div className="admin-help-strip"><Package size={20} /><p>Se aplica el mayor ahorro disponible. Los escalones no se acumulan y, si hay cupón, se elige entre cupón y mayoreo el descuento mayor.</p></div>
    {message && <p className="admin-feedback" role="status">{message}</p>}
    {!loading && !configured && <p className="admin-feedback" role="alert">Mayoreo aún no está habilitado en la base de datos. Hace falta instalar la configuración inicial; tus precios actuales no cambian.</p>}
    <div className="wholesale-layout">
      <div className="wholesale-rules"><label className="admin-field">Buscar modelo<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nombre del modelo" /></label>
        {loading ? <p role="status">Cargando escalones…</p> : !visible.length ? <div className="admin-empty-card"><Package size={32} /><h3>{rules.length ? "Sin coincidencias" : "Tu primer precio de mayoreo"}</h3><p>{rules.length ? "Prueba con otro nombre." : "Elige un modelo y crea un escalón. Puedes preparar varios y activarlos cuando quieras."}</p></div> : visible.map(rule => <article className="wholesale-rule" key={rule.id}>
          <div><span className={`admin-status-chip ${rule.active ? "is-active" : ""}`}>{rule.active ? "Activo" : "Pausado"}</span><h3>{products.find(p => p.slug === rule.product_slug)?.name || rule.product_slug}</h3><p>Desde <strong>{rule.min_quantity} piezas</strong> del mismo modelo</p><strong className="wholesale-saving">{rule.discount_type === "fixed" ? `${money(rule.discount_value)} menos por pieza` : `${rule.discount_value}% de descuento`}</strong></div>
          <div className="wholesale-rule-actions"><button disabled={saving} onClick={() => { setForm(rule); setMessage(""); }}><Pencil size={16} />Editar</button><button disabled={saving} onClick={() => void mutate("PATCH", { ...rule, active: !rule.active })}>{rule.active ? "Pausar" : "Activar"}</button><button aria-label="Eliminar escalón" disabled={saving} onClick={() => setDeleteId(rule.id)}><Trash2 size={16} /></button></div>
          {deleteId === rule.id && <div className="admin-delete-confirm"><p>¿Eliminar este escalón de {rule.min_quantity} piezas?</p><button disabled={saving} onClick={() => void mutate("DELETE", undefined, rule.id)}>Sí, eliminar</button><button onClick={() => setDeleteId("")}>Cancelar</button></div>}
        </article>)}
      </div>
      <form className="wholesale-editor" onSubmit={submit}><header><h3>{form.id ? "Editar escalón" : "Nuevo escalón"}</h3>{form.id && <button type="button" onClick={() => setForm(empty())}><Plus size={16} />Nuevo</button>}</header>
        <fieldset disabled={saving || loading || !configured}>
          <label className="admin-field">Modelo<select required value={form.product_slug} onChange={e => setForm({ ...form, product_slug: e.target.value })}><option value="">Selecciona un modelo</option>{products.map(p => <option key={p.slug} value={p.slug}>{p.name} · {money(p.priceMxn)}</option>)}</select></label>
          <label className="admin-field">A partir de cuántas piezas<input required type="number" min="2" max="500" step="1" value={form.min_quantity || ""} onChange={e => setForm({ ...form, min_quantity: Number(e.target.value) })} /></label>
          <label className="admin-field">Cómo baja el precio<select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value as "fixed" | "percent" })}><option value="fixed">Pesos menos por pieza</option><option value="percent">Porcentaje de descuento</option></select></label>
          <label className="admin-field">{form.discount_type === "fixed" ? "Rebaja por pieza (MXN)" : "Descuento (%)"}<input required type="number" min="0.01" max={form.discount_type === "percent" ? 99 : 100000} step="0.01" value={form.discount_value || ""} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })} /></label>
          <label className="wholesale-toggle"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />Activar este escalón al guardar</label>
          {product && preview && <div className="wholesale-preview"><span>VISTA PREVIA DEL ESCALÓN</span><p>{form.min_quantity || 1} × {money(product.priceMxn)}</p><strong>{money(product.priceMxn - preview.discountMxn / (form.min_quantity || 1))} <small>por pieza</small></strong><p>Ahorro: {money(preview.discountMxn)} · Envío calculado aparte.</p></div>}
          <button className="btn primary" type="submit"><Save size={16} />{saving ? "Guardando…" : "Guardar escalón"}</button>
        </fieldset>
      </form>
    </div>
  </section>;
}
