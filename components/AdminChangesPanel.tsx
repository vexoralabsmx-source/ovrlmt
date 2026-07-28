"use client";

import { useEffect, useState } from "react";

type ChangeRequest = {
  id: string;
  customer_email: string;
  requested_size: string | null;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  admin_notes: string | null;
  created_at: string;
  preorders?: {
    order_code?: string;
    customer_name?: string;
    product_name?: string;
    size?: string;
  } | null;
};

export function AdminChangesPanel({ getToken }: { getToken: () => Promise<string | null> }) {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");

  async function load() {
    const token = await getToken();
    if (!token) return;
    const response = await fetch("/api/admin/changes", { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (response.ok) setRequests(result.requests || []);
    else setMessage(result.error || "No pudimos cargar las solicitudes.");
  }

  useEffect(() => { void load(); }, []);

  async function updateRequest(id: string, status: ChangeRequest["status"], adminNotes: string) {
    const token = await getToken();
    if (!token) return;
    setSavingId(id);
    const response = await fetch("/api/admin/changes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status, adminNotes }),
    });
    const result = await response.json();
    setSavingId("");
    setMessage(response.ok ? "Solicitud actualizada." : result.error || "No pudimos actualizarla.");
    if (response.ok) await load();
  }

  return (
    <div className="admin-review-list admin-change-list">
      {message && <p className="account-notice">{message}</p>}
      {!requests.length && <p className="admin-empty-state">No hay solicitudes de cambio de talla.</p>}
      {requests.map((request) => (
        <article key={request.id}>
          <div>
            <span>{request.preorders?.order_code || "PEDIDO"} / {request.status}</span>
            <small>{new Date(request.created_at).toLocaleDateString("es-MX")}</small>
          </div>
          <h3>{request.preorders?.customer_name || request.customer_email}</h3>
          <p>{request.preorders?.product_name} · talla actual {request.preorders?.size || "—"} → talla solicitada {request.requested_size || "—"}</p>
          <p>{request.reason}</p>
          <label>
            <span>NOTAS INTERNAS</span>
            <textarea
              rows={3}
              defaultValue={request.admin_notes || ""}
              id={`change-notes-${request.id}`}
              placeholder="Disponibilidad, seguimiento o acuerdo con el cliente"
            />
          </label>
          <footer>
            {(["approved", "rejected", "completed"] as const).map((status) => (
              <button
                key={status}
                disabled={savingId === request.id}
                onClick={() => {
                  const notes = (document.getElementById(`change-notes-${request.id}`) as HTMLTextAreaElement | null)?.value || "";
                  void updateRequest(request.id, status, notes);
                }}
              >
                {status === "approved" ? "APROBAR" : status === "rejected" ? "RECHAZAR" : "COMPLETAR"}
              </button>
            ))}
          </footer>
        </article>
      ))}
    </div>
  );
}
