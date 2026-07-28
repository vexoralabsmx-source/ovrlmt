"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, MessageSquarePlus, Star } from "lucide-react";

type Review = {
  id: string;
  product_slug: string;
  display_name: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "approved" | "rejected";
  verified_purchase: boolean;
  created_at: string;
};

export function AdminReviewsPanel({
  products,
  getToken,
}: {
  products: Array<{ slug: string; name: string }>;
  getToken: () => Promise<string | null>;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const token = await getToken();
    if (!token) return;
    const response = await fetch("/api/admin/reviews", { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (response.ok) setReviews(result.reviews || []);
    else setMessage(result.error || "No pudimos cargar reseñas.");
  }
  useEffect(() => { void load(); }, []);

  async function createReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await getToken();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    const response = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        productSlug: form.get("productSlug"), displayName: form.get("displayName"),
        rating: Number(form.get("rating")), title: form.get("title"), body: form.get("body"),
        imageUrls: String(form.get("imageUrls") || "").split(/\n|,/).map((url) => url.trim()).filter(Boolean),
      }),
    });
    const result = await response.json();
    setSaving(false);
    setMessage(response.ok ? "Reseña publicada." : result.error);
    if (response.ok) { event.currentTarget.reset(); await load(); }
  }

  async function moderate(id: string, status: Review["status"]) {
    const token = await getToken();
    if (!token) return;
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  return (
    <div className="admin-reviews-layout">
      <form className="admin-editor admin-review-form" onSubmit={createReview}>
        <div className="admin-editor-head"><div><span>RESEÑA MANUAL</span><h2>Publicar reseña.</h2><p>El nombre es opcional. Vacío se publica como Anónimo.</p></div><MessageSquarePlus /></div>
        <label><span>PRODUCTO</span><select required name="productSlug"><option value="">Selecciona</option>{products.map((product) => <option key={product.slug} value={product.slug}>{product.name}</option>)}</select></label>
        <label><span>ESTRELLAS</span><select required name="rating" defaultValue="5"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label>
        <label><span>NOMBRE (OPCIONAL)</span><input name="displayName" maxLength={60} placeholder="Anónimo" /></label>
        <label><span>TÍTULO (OPCIONAL)</span><input name="title" maxLength={100} /></label>
        <label><span>RESEÑA</span><textarea required minLength={10} maxLength={1200} rows={5} name="body" /></label>
        <label><span>URLS DE FOTOS (OPCIONAL)</span><textarea rows={3} name="imageUrls" placeholder="Una URL por línea" /></label>
        <button className="submit-btn" disabled={saving}>{saving ? "PUBLICANDO..." : "PUBLICAR RESEÑA"}</button>
        {message && <p className="account-notice">{message}</p>}
      </form>
      <div className="admin-review-list">
        {reviews.map((review) => (
          <article key={review.id}>
            <div><span>{review.product_slug} / {review.status}</span><div className="review-stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < review.rating ? "currentColor" : "none"} />)}</div></div>
            <h3>{review.display_name || "Anónimo"} {review.verified_purchase && <BadgeCheck size={15} />}</h3>
            <p>{review.body}</p>
            <footer><button onClick={() => moderate(review.id, "approved")}>APROBAR</button><button onClick={() => moderate(review.id, "rejected")}>RECHAZAR</button></footer>
          </article>
        ))}
      </div>
    </div>
  );
}
