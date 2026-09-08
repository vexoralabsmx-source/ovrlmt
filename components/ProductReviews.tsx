"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Star } from "lucide-react";

type Review = {
  id: string;
  display_name: string;
  rating: number;
  title: string | null;
  body: string;
  image_urls: string[];
  verified_purchase: boolean;
  created_at: string;
};

export function ProductReviews({ productSlug }: { productSlug: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    let active = true;
    setLoading(true); setError(false);
    fetch(`/api/reviews?product=${encodeURIComponent(productSlug)}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("reviews"); return response.json(); })
      .then((result) => { if (active) setReviews(result.reviews || []); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { window.clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [productSlug]);
  const average = useMemo(() => reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0, [reviews]);

  return (
    <section className="product-reviews section-pad">
      <div className="commerce-heading">
        <div><p className="section-label">COMMUNITY / REVIEWS</p><h2>RESEÑAS<br />REALES</h2></div>
        <p>{reviews.length ? `${average.toFixed(1)} de 5 · ${reviews.length} reseña${reviews.length === 1 ? "" : "s"}` : "Las compras verificadas pueden dejar una reseña desde su cuenta."}</p>
      </div>
      {loading ? <div className="reviews-empty">CARGANDO RESEÑAS</div> : error ? <div className="reviews-empty" role="status">No pudimos cargar las reseñas. Inténtalo de nuevo más tarde.</div> : !reviews.length ? (
        <div className="reviews-empty"><Star size={24} /><p>Todavía no hay reseñas publicadas para esta pieza.</p></div>
      ) : (
        <div className="reviews-grid">
          {reviews.map((review) => (
            <article key={review.id}>
              <div className="review-stars" aria-label={`${review.rating} de 5 estrellas`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill={index < review.rating ? "currentColor" : "none"} />)}</div>
              <h3>{review.title || "Experiencia OVRLMT"}</h3>
              <p>{review.body}</p>
              {!!review.image_urls?.length && <div className="review-photos">{review.image_urls.map((url) => <div key={url}><Image src={url} alt="Foto compartida en la reseña" fill sizes="160px" /></div>)}</div>}
              <footer><strong>{review.display_name || "Anónimo"}</strong>{review.verified_purchase && <span><BadgeCheck size={13} /> Compra verificada</span>}<time>{new Date(review.created_at).toLocaleDateString("es-MX")}</time></footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
