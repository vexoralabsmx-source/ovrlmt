"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, RefreshCw } from "lucide-react";
import { getOrderStatusLabel } from "@/src/lib/orderStatus";
import { ADMIN_EMAIL } from "@/src/lib/authConfig";
import { clearBrowserSession, getBrowserSession } from "@/src/lib/sessionStorage";

type CustomerOrder = {
  id: string;
  order_code: string;
  product_name: string;
  size: string;
  quantity: number;
  total_mxn: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function money(value: number) {
  return `$${Number(value).toLocaleString("es-MX")} MXN`;
}

export function AccountDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadOrders() {
    setLoading(true);
    const session = getBrowserSession();
    const token = session?.accessToken;
    const userEmail = session?.email.toLowerCase();

    if (!token || !userEmail) {
      router.replace("/login?next=/cuenta");
      return;
    }

    if (userEmail === ADMIN_EMAIL) {
      router.replace("/admin");
      return;
    }

    setEmail(userEmail);
    const response = await fetch("/api/account/orders", { headers: { Authorization: `Bearer ${token}` } });
    const json = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(json.message || "No pudimos cargar tus pedidos.");
      return;
    }

    setOrders(json.orders || []);
  }

  useEffect(() => { void loadOrders(); }, []);

  async function signOut() {
    clearBrowserSession();
    router.replace("/login");
  }

  return (
    <section className="account-page">
      <header>
        <div>
          <p className="eyebrow"><i /> MI CUENTA</p>
          <h1>Tus pedidos.</h1>
        </div>
        <div className="account-actions">
          <button onClick={loadOrders} disabled={loading}><RefreshCw size={15} /> ACTUALIZAR</button>
          <button onClick={signOut}>CERRAR SESION</button>
        </div>
      </header>
      <p className="account-email">{email}</p>
      {message && <p className="preorder-error">{message}</p>}
      {loading ? <div className="orders-empty">CARGANDO PEDIDOS</div> : orders.length === 0 ? (
        <div className="orders-empty">
          <PackageCheck size={28} />
          <p>No encontramos pedidos con este correo.</p>
          <Link className="btn primary" href="/drop">VER DROP</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article key={order.id}>
              <div>
                <span>{order.order_code}</span>
                <h2>{order.product_name}</h2>
                <p>{order.quantity}x / TALLA {order.size}</p>
              </div>
              <div>
                <span>ESTADO</span>
                <strong>{getOrderStatusLabel(order.status)}</strong>
                <p>{order.notes || "Sin notas nuevas por ahora."}</p>
              </div>
              <div>
                <span>TOTAL</span>
                <strong>{money(order.total_mxn)}</strong>
                <p>Actualizado {new Date(order.updated_at).toLocaleDateString("es-MX")}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
