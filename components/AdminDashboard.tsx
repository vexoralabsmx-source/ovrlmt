"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Boxes, Eye, ImageIcon, Mail, PackageCheck, PackagePlus, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import { ADMIN_EMAIL } from "@/src/lib/authConfig";
import { AdminShippingPanel, type ShippingAdminOrder } from "@/components/AdminShippingPanel";
import { getOrderStatusLabel, ORDER_STATUSES, type OrderStatus } from "@/src/lib/orderStatus";
import { clearBrowserSession, getBrowserSession } from "@/src/lib/sessionStorage";
import { SIZES, type ProductSize } from "@/data/store";

type AdminOrder = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  product_name: string;
  size: string;
  quantity: number;
  total_mxn: number;
  status: string;
  address_city: string;
  address_state: string;
  notes: string | null;
  payment_provider?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  payment_receipt_no?: string | null;
  paid_at?: string | null;
  shipping_status?: string | null;
  tracking_id?: string | null;
  tracking_link?: string | null;
  shipping_provider?: string | null;
  shipping_cost_real?: number | null;
  shipments?: ShippingAdminOrder["shipments"];
  created_at: string;
  updated_at: string;
};
type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  drop_number: string | null;
  price_mxn: number;
  image_url: string | null;
  images: string[] | null;
  active: boolean;
  status: "draft" | "active" | "sold_out" | "hidden";
  description: string | null;
  color: string | null;
  fit: string | null;
  material: string | null;
  print_method: string | null;
  featured: boolean;
  story: string | null;
  code: string | null;
  accent: "black" | "bone" | "chrome";
};
type StockRow = { product_id: string; size: ProductSize; total: number; reserved: number; sold: number };
type ProductForm = {
  id?: string;
  slug: string;
  name: string;
  drop: string;
  priceMxn: number;
  images: string;
  status: AdminProduct["status"];
  description: string;
  color: string;
  fit: string;
  material: string;
  printMethod: string;
  featured: boolean;
  story: string;
  code: string;
  accent: AdminProduct["accent"];
  stock: Record<ProductSize, { total: number; reserved: number; sold: number }>;
};

function money(value: number) {
  return `$${Number(value).toLocaleString("es-MX")} MXN`;
}
const emptyStock = () => Object.fromEntries(SIZES.map((size) => [size, { total: 0, reserved: 0, sold: 0 }])) as ProductForm["stock"];
const emptyProductForm = (): ProductForm => ({ slug: "", name: "", drop: "001", priceMxn: 359, images: "", status: "draft", description: "", color: "Negro", fit: "Premium fit", material: "100% algodón / 190 g/m2", printMethod: "DTF textil premium", featured: false, story: "", code: "", accent: "black", stock: emptyStock() });
function available(row: { total: number; reserved: number; sold: number }) { return Math.max(0, Number(row.total || 0) - Number(row.reserved || 0) - Number(row.sold || 0)); }

export function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [tab, setTab] = useState<"orders" | "products" | "shipping">("orders");
  const [orderQuery, setOrderQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | OrderStatus>("all");
  const [productStatusFilter, setProductStatusFilter] = useState<"all" | AdminProduct["status"]>("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [status, setStatus] = useState<OrderStatus>(ORDER_STATUSES[0].value);
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selected = useMemo(() => orders.find((order) => order.id === selectedId), [orders, selectedId]);
  const selectedProduct = useMemo(() => products.find((product) => product.id === selectedProductId), [products, selectedProductId]);
  const productPreviewImages = useMemo(() => productForm.images.split(/\n|,/).map((item) => item.trim()).filter(Boolean), [productForm.images]);
  const drops = useMemo(() => Array.from(new Set(products.map((product) => product.drop_number || "SIN DROP"))).sort(), [products]);
  const filteredOrders = useMemo(() => {
    const query = orderQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
      const matchesQuery = !query || [
        order.order_code,
        order.customer_name,
        order.customer_email,
        order.customer_whatsapp,
        order.product_name,
        order.address_city,
        order.address_state,
      ].join(" ").toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [orders, orderQuery, orderStatusFilter]);
  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesStatus = productStatusFilter === "all" || product.status === productStatusFilter;
      const matchesDrop = dropFilter === "all" || (product.drop_number || "SIN DROP") === dropFilter;
      const matchesQuery = !query || [product.name, product.slug, product.code, product.color, product.drop_number].join(" ").toLowerCase().includes(query);
      return matchesStatus && matchesDrop && matchesQuery;
    });
  }, [products, productQuery, productStatusFilter, dropFilter]);
  const adminStats = useMemo(() => {
    const liveProducts = products.filter((product) => product.status === "active").length;
    const revenue = orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total_mxn || 0), 0);
    const pendingPayment = orders.filter((order) => order.status === "pending_payment").length;
    const availableUnits = stockRows.reduce((sum, row) => sum + available(row), 0);
    return { liveProducts, revenue, pendingPayment, availableUnits };
  }, [orders, products, stockRows]);
  const lowStockProducts = useMemo(() => products.filter((product) => {
    const rows = stockRows.filter((row) => row.product_id === product.id);
    const availableTotal = rows.reduce((sum, row) => sum + available(row), 0);
    return product.status === "active" && availableTotal <= 4;
  }), [products, stockRows]);

  async function getToken() {
    const session = getBrowserSession();
    const token = session?.accessToken;
    const email = session?.email.toLowerCase();

    if (!token || !email) {
      router.replace("/login?next=/admin");
      return null;
    }

    if (email !== ADMIN_EMAIL) {
      router.replace("/cuenta");
      return null;
    }

    return token;
  }

  async function loadOrders() {
    setLoading(true);
    setMessage("");
    const token = await getToken();
    if (!token) return;

    const response = await fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } });
    const json = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(json.message || "No pudimos cargar pedidos.");
      return;
    }

    const nextOrders = json.orders || [];
    setOrders(nextOrders);
    if (!selectedId && nextOrders[0]) {
      setSelectedId(nextOrders[0].id);
      setStatus(nextOrders[0].status);
      setNotes(nextOrders[0].notes || "");
    }
  }

  async function loadProducts() {
    setMessage("");
    const token = await getToken();
    if (!token) return;
    const response = await fetch("/api/admin/products", { headers: { Authorization: `Bearer ${token}` } });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.message || "No pudimos cargar productos.");
      return;
    }
    setProducts(json.products || []);
    setStockRows(json.stock || []);
    const first = (json.products || [])[0] as AdminProduct | undefined;
    if (first && !selectedProductId) chooseProduct(first, json.stock || []);
  }

  useEffect(() => { void loadOrders(); void loadProducts(); }, []);

  function chooseOrder(order: AdminOrder) {
    setSelectedId(order.id);
    setStatus(order.status as OrderStatus);
    setNotes(order.notes || "");
    setMessage("");
  }

  async function saveOrder() {
    const token = await getToken();
    if (!token || !selected) return;

    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: selected.id, status, notes, sendEmail }),
    });
    const json = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(json.message || "No pudimos guardar.");
      return;
    }

    setOrders((current) => current.map((order) => order.id === selected.id ? { ...order, status, notes, updated_at: new Date().toISOString() } : order));
    setMessage(sendEmail ? (json.emailSent ? "Pedido actualizado y correo enviado." : `Pedido actualizado. Error al enviar correo: ${json.emailError || "desconocido"}`) : "Pedido actualizado sin enviar correo.");
  }

  function productStock(productId: string, rows = stockRows) {
    return Object.fromEntries(SIZES.map((size) => {
      const row = rows.find((item) => item.product_id === productId && item.size === size);
      return [size, { total: Number(row?.total || 0), reserved: Number(row?.reserved || 0), sold: Number(row?.sold || 0) }];
    })) as ProductForm["stock"];
  }

  function chooseProduct(product: AdminProduct, rows = stockRows) {
    setSelectedProductId(product.id);
    setProductForm({
      id: product.id,
      slug: product.slug,
      name: product.name,
      drop: product.drop_number || "001",
      priceMxn: Number(product.price_mxn || 359),
      images: (product.images?.length ? product.images : product.image_url ? [product.image_url] : []).join("\n"),
      status: product.status || (product.active ? "active" : "hidden"),
      description: product.description || "",
      color: product.color || "Negro",
      fit: product.fit || "Premium fit",
      material: product.material || "100% algodón / 190 g/m2",
      printMethod: product.print_method || "DTF textil premium",
      featured: Boolean(product.featured),
      story: product.story || "",
      code: product.code || "",
      accent: product.accent || "black",
      stock: productStock(product.id, rows),
    });
    setMessage("");
  }

  function newProduct() {
    setSelectedProductId("");
    setProductForm(emptyProductForm());
    setTab("products");
  }

  async function saveProduct() {
    const token = await getToken();
    if (!token) return;
    setSaving(true);
    setMessage("");
    const method = productForm.id ? "PATCH" : "POST";
    const response = await fetch("/api/admin/products", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(productForm),
    });
    const json = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(json.message || "No pudimos guardar producto.");
      return;
    }
    setMessage(productForm.id ? "Producto actualizado." : "Producto creado.");
    await loadProducts();
  }

  async function deleteProduct() {
    const token = await getToken();
    if (!token || !productForm.id) return;
    if (!window.confirm("Eliminar este producto de Supabase?")) return;
    setSaving(true);
    const response = await fetch(`/api/admin/products?id=${encodeURIComponent(productForm.id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const json = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(json.message || "No pudimos eliminar producto.");
      return;
    }
    setMessage("Producto eliminado.");
    setSelectedProductId("");
    setProductForm(emptyProductForm());
    await loadProducts();
  }

  async function signOut() {
    clearBrowserSession();
    router.replace("/login");
  }

  return (
    <section className="admin-page">
      <header>
        <div>
          <p className="eyebrow"><i /> ADMIN</p>
          <h1>Control<br />Room.</h1>
        </div>
        <div className="account-actions">
          <button onClick={() => { void loadOrders(); void loadProducts(); }} disabled={loading}><RefreshCw size={15} /> ACTUALIZAR</button>
          <button onClick={newProduct}><PackagePlus size={15} /> NUEVO PRODUCTO</button>
          <button onClick={signOut}>SALIR</button>
        </div>
      </header>
      {message && <p className="preorder-error">{message}</p>}
      <div className="admin-command-center">
        <article><span><PackageCheck size={15} /> PEDIDOS</span><strong>{orders.length}</strong><small>{adminStats.pendingPayment} esperando pago</small></article>
        <article><span><Boxes size={15} /> INVENTARIO</span><strong>{adminStats.availableUnits}</strong><small>unidades disponibles</small></article>
        <article><span><Eye size={15} /> DROP LIVE</span><strong>{adminStats.liveProducts}</strong><small>productos activos</small></article>
        <article><span><Mail size={15} /> VENTAS</span><strong>{money(adminStats.revenue)}</strong><small>sin cancelados</small></article>
      </div>
      <div className="admin-tabs"><button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>PEDIDOS</button><button className={tab === "shipping" ? "active" : ""} onClick={() => setTab("shipping")}>ENVÍOS</button><button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>PRODUCTOS</button></div>
      {lowStockProducts.length > 0 && <div className="low-stock-alert"><AlertTriangle size={15} /><b>STOCK BAJO</b>{lowStockProducts.map((product) => <span key={product.id}>{product.name}</span>)}</div>}
      {tab === "shipping" ? <AdminShippingPanel orders={orders} getToken={getToken} reloadOrders={loadOrders} /> : tab === "orders" ? <div className="admin-grid">
        <div className="admin-orders">
          <div className="admin-list-tools">
            <label><Search size={14} /><input value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} placeholder="Buscar pedido, cliente, correo..." /></label>
            <select value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value as "all" | OrderStatus)}><option value="all">Todos los estados</option>{ORDER_STATUSES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select>
          </div>
          {loading ? <p>CARGANDO</p> : filteredOrders.length ? filteredOrders.map((order) => (
            <button key={order.id} className={selectedId === order.id ? "active" : ""} onClick={() => chooseOrder(order)}>
              <span>{order.order_code}</span>
              <strong>{order.customer_name}</strong>
              <small>{getOrderStatusLabel(order.status)} / {money(order.total_mxn)}</small>
            </button>
          )) : <p className="admin-empty-state">No hay pedidos con esos filtros.</p>}
        </div>
        <div className="admin-editor">
          {selected ? <>
            <div className="admin-editor-head">
              <div>
                <span>{selected.order_code}</span>
                <h2>{selected.product_name}</h2>
                <p>{selected.customer_name} / {selected.customer_email} / {selected.customer_whatsapp}</p>
              </div>
              <strong>{money(selected.total_mxn)}</strong>
            </div>
            <div className="admin-meta">
              <span>{selected.quantity}x / TALLA {selected.size}</span>
              <span>{selected.address_city}, {selected.address_state}</span>
              <span>{new Date(selected.created_at).toLocaleDateString("es-MX")}</span>
              {selected.payment_provider && <span>PAGO {selected.payment_provider.toUpperCase()} / {selected.payment_status || "PENDIENTE"}</span>}
              {selected.payment_receipt_no && <span>RECIBO {selected.payment_receipt_no}</span>}
            </div>
            <label><span>ESTADO</span><select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)}>{ORDER_STATUSES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
            <label><span>NOTAS PARA CLIENTE</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={7} placeholder="Ej. Pago validado. Tu pedido entra a produccion esta semana." /></label>
            <label className="send-toggle"><input type="checkbox" checked={sendEmail} onChange={(event) => setSendEmail(event.target.checked)} /> Enviar correo de actualizacion con el estilo OVRLMT</label>
            <button className="submit-btn" onClick={saveOrder} disabled={saving}><span>{saving ? "GUARDANDO" : "GUARDAR CAMBIOS"}</span>{sendEmail ? <Mail size={16} /> : <Save size={16} />}</button>
          </> : <p>Selecciona un pedido.</p>}
        </div>
      </div> : <div className="admin-grid products-admin-grid">
        <div className="admin-orders">
          <div className="admin-list-tools">
            <label><Search size={14} /><input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Buscar playera, slug, color..." /></label>
            <select value={productStatusFilter} onChange={(event) => setProductStatusFilter(event.target.value as "all" | AdminProduct["status"])}><option value="all">Todos</option><option value="draft">draft</option><option value="active">active</option><option value="sold_out">sold_out</option><option value="hidden">hidden</option></select>
            <select value={dropFilter} onChange={(event) => setDropFilter(event.target.value)}><option value="all">Todos los drops</option>{drops.map((drop) => <option value={drop} key={drop}>{drop}</option>)}</select>
          </div>
          {filteredProducts.map((product) => {
            const rows = stockRows.filter((row) => row.product_id === product.id);
            const total = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);
            const availableTotal = rows.reduce((sum, row) => sum + available(row), 0);
            return <button key={product.id} className={selectedProductId === product.id ? "active" : ""} onClick={() => chooseProduct(product)}>
              <span>{product.status} / {product.drop_number || "DROP"}</span>
              <strong>{product.name}</strong>
              <small>{money(product.price_mxn)} / {availableTotal} disponibles de {total}</small>
            </button>;
          })}
          {!filteredProducts.length && <p className="admin-empty-state">No hay productos con esos filtros.</p>}
        </div>
        <div className="admin-editor product-editor">
          <div className="admin-editor-head">
            <div><span>{productForm.id ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO"}</span><h2>{productForm.name || "Producto"}</h2><p>Administra catalogo, estado, mockups, drops y stock por talla.</p></div>
            {productForm.id && <button className="danger-icon" type="button" onClick={deleteProduct} disabled={saving}><Trash2 size={17} /></button>}
          </div>
          <div className="product-admin-preview">
            <div className="product-preview-image">
              {productPreviewImages[0] ? <img src={productPreviewImages[0]} alt={productForm.name || "Preview del producto"} /> : <ImageIcon size={42} />}
              <span>{productForm.status}</span>
            </div>
            <div className="product-preview-copy">
              <span>DROP {productForm.drop || selectedProduct?.drop_number || "001"} / {productForm.code || "SIN CODIGO"}</span>
              <strong>{productForm.name || "Nueva playera OVRLMT"}</strong>
              <p>{productForm.description || "Sube mockups, define precio, tallas y publica cuando el drop este listo."}</p>
              <div>
                <button type="button" onClick={() => setProductForm({ ...productForm, status: "active", featured: true })}>PUBLICAR DROP</button>
                <button type="button" onClick={() => setProductForm({ ...productForm, status: "hidden" })}>OCULTAR</button>
                <button type="button" onClick={newProduct}>NUEVA PLAYERA</button>
              </div>
            </div>
          </div>
          <div className="product-form-grid">
            <label><span>NOMBRE</span><input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label>
            <label><span>SLUG</span><input value={productForm.slug} onChange={(event) => setProductForm({ ...productForm, slug: event.target.value })} /></label>
            <label><span>PRECIO MXN</span><input type="number" value={productForm.priceMxn} onChange={(event) => setProductForm({ ...productForm, priceMxn: Number(event.target.value) })} /></label>
            <label><span>DROP</span><input value={productForm.drop} onChange={(event) => setProductForm({ ...productForm, drop: event.target.value })} /></label>
            <label><span>ESTADO</span><select value={productForm.status} onChange={(event) => setProductForm({ ...productForm, status: event.target.value as ProductForm["status"] })}><option value="draft">draft</option><option value="active">active</option><option value="sold_out">sold_out</option><option value="hidden">hidden</option></select></label>
            <label><span>ACENTO VISUAL</span><select value={productForm.accent} onChange={(event) => setProductForm({ ...productForm, accent: event.target.value as ProductForm["accent"] })}><option value="black">black</option><option value="bone">bone</option><option value="chrome">chrome</option></select></label>
            <label><span>MATERIAL</span><input value={productForm.material} onChange={(event) => setProductForm({ ...productForm, material: event.target.value })} /></label>
            <label><span>IMPRESIÓN</span><input value={productForm.printMethod} onChange={(event) => setProductForm({ ...productForm, printMethod: event.target.value })} /></label>
            <label><span>COLOR</span><input value={productForm.color} onChange={(event) => setProductForm({ ...productForm, color: event.target.value })} /></label>
            <label><span>FIT</span><input value={productForm.fit} onChange={(event) => setProductForm({ ...productForm, fit: event.target.value })} /></label>
            <label><span>CÓDIGO</span><input value={productForm.code} onChange={(event) => setProductForm({ ...productForm, code: event.target.value })} /></label>
            <label className="send-toggle"><input type="checkbox" checked={productForm.featured} onChange={(event) => setProductForm({ ...productForm, featured: event.target.checked })} /> Producto destacado</label>
            <label className="wide"><span>DESCRIPCIÓN</span><textarea rows={4} value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></label>
            <label className="wide"><span>IMÁGENES / MOCKUPS (UNA URL POR LÍNEA)</span><textarea rows={4} value={productForm.images} onChange={(event) => setProductForm({ ...productForm, images: event.target.value })} /></label>
            <label className="wide"><span>STORY</span><textarea rows={4} value={productForm.story} onChange={(event) => setProductForm({ ...productForm, story: event.target.value })} /></label>
          </div>
          <div className="stock-admin">
            <p className="section-label">STOCK POR TALLA</p>
            {SIZES.map((size) => {
              const row = productForm.stock[size];
              return <div key={size} className="stock-row"><strong>{size}</strong><label><span>Total</span><input type="number" value={row.total} onChange={(event) => setProductForm({ ...productForm, stock: { ...productForm.stock, [size]: { ...row, total: Number(event.target.value) } } })} /></label><label><span>Reservado</span><input type="number" value={row.reserved} onChange={(event) => setProductForm({ ...productForm, stock: { ...productForm.stock, [size]: { ...row, reserved: Number(event.target.value) } } })} /></label><label><span>Vendido</span><input type="number" value={row.sold} onChange={(event) => setProductForm({ ...productForm, stock: { ...productForm.stock, [size]: { ...row, sold: Number(event.target.value) } } })} /></label><span>Disponible {available(row)}</span></div>;
            })}
          </div>
          <button className="submit-btn" onClick={saveProduct} disabled={saving}><span>{saving ? "GUARDANDO" : "GUARDAR PRODUCTO"}</span><Save size={16} /></button>
        </div>
      </div>}
    </section>
  );
}
