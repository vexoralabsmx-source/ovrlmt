import Image from "next/image";
import { communityPhotos } from "@/data/community";
import { productUrl } from "@/data/commerce";
import Link from "next/link";
import { CreditCard, MessageCircle, PackageCheck, Truck } from "lucide-react";
import { FAQ, POLICIES, garmentType } from "@/data/commerce";
import type { Product } from "@/data/products";
export function HowToBuy() {
  const steps = [
    "Elige diseño y talla.",
    "Completa tus datos de entrega.",
    "Paga con Clip o transferencia.",
    "Producimos tu pieza en Puebla.",
    "Recibe guía o confirmación de entrega.",
  ];
  return (
    <section className="how-to-buy section-pad">
      <div className="commerce-heading">
        <div>
          <p className="section-label">DE LA ELECCIÓN A TU PUERTA</p>
          <h2>CÓMO COMPRAR</h2>
        </div>
        <p>{POLICIES.payment}</p>
      </div>
      <ol>
        {steps.map((step, i) => (
          <li key={step}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <p>{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function TrustSection() {
  const items = [
    [MessageCircle, "Soporte por WhatsApp"],
    [CreditCard, "Pago con tarjeta mediante Clip"],
    [PackageCheck, "Producción en Puebla"],
    [Truck, "Seguimiento desde tu cuenta"],
  ] as const;
  return (
    <section
      className="trust-section section-pad"
      aria-label="Servicios de OVRLMT"
    >
      <div className="commerce-heading"><div><p className="section-label">COMPRA CON CONFIANZA</p><h2>COMPRA<br />SEGURA.</h2></div></div>
      <div className="trust-grid">
        {items.map(([Icon, label]) => (
          <article key={label}>
            <Icon size={22} aria-hidden="true" />
            <p>{label}</p>
          </article>
        ))}
      </div>
      <Link className="text-link" href="/cuenta">
        CONSULTAR MIS PEDIDOS ↗
      </Link>
    </section>
  );
}
export function SocialProofSection() {
  return (
    <section className="proof-section section-pad">
      <div className="commerce-heading">
        <div>
          <p className="section-label">OVRLMT / EN LA CALLE</p>
          <h2>PIEZAS CON HISTORIA.</h2>
        </div>
        <p>Las experiencias de compra se publican en la ficha de cada pieza.</p>
      </div>
      {communityPhotos.length ? (
        <div className="community-grid">
          {communityPhotos.map((photo) => (
            <figure key={photo.image}>
              <Image
                src={photo.image}
                alt={photo.alt}
                width={600}
                height={750}
                sizes="(max-width:700px) 90vw, 30vw"
              />
              <figcaption>
                {photo.caption}
                {photo.heightCm && <span> · {photo.heightCm} cm</span>}
                {photo.size && <span> · Talla {photo.size}</span>}
                {photo.fit && <span> · {photo.fit}</span>}
                <Link
                  className="text-link"
                  href={productUrl(photo.productSlug)}
                >
                  VER LA PIEZA ↗
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="reviews-empty">
          <PackageCheck size={26} aria-hidden="true" />
          <p>
            Este espacio espera las primeras fotografías de nuestra comunidad.
          </p>
          <span>
            ¿Ya recibiste tu pieza? Comparte tu experiencia desde tu cuenta.
          </span>
          <Link className="text-link" href="/cuenta">
            VER MI CUENTA ↗
          </Link>
        </div>
      )}
    </section>
  );
}
export function QualitySection({ products }: { products: Product[] }) {
  return (
    <section className="quality-section section-pad">
      <div className="commerce-heading">
        <div>
          <p className="section-label">MATERIA / FORMA / GRÁFICA</p>
          <h2>LO QUE LLEVAS.</h2>
        </div>
        <p>
          Producción local en Puebla, México. Los detalles de cada pieza, sin
          letras pequeñas.
        </p>
      </div>
      <div className="quality-grid">
        {products.map((product) => (
          <article key={product.slug}>
            <span>{garmentType(product)}</span>
            <h3>{product.name}</h3>
            <dl>
              <div>
                <dt>Material / gramaje</dt>
                <dd>{product.material || "Consultar por WhatsApp"}</dd>
              </div>
              <div>
                <dt>Impresión</dt>
                <dd>{product.printMethod || "Consultar por WhatsApp"}</dd>
              </div>
              <div>
                <dt>Corte</dt>
                <dd>{product.fit || "Consultar por WhatsApp"}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
export function SizeSummary() {
  return (
    <section className="size-summary section-pad">
      <div>
        <p className="section-label">ENCUENTRA TU FIT</p>
        <h2>LA TALLA IMPORTA.</h2>
      </div>
      <div>
        <p>
          Extiende una prenda que te quede bien. Mide de axila a axila y del
          hombro al borde inferior. Confirma las medidas del modelo que elegiste
          antes de pagar.
        </p>
        <Link className="btn ghost" href="/size-guide">
          GUÍA DE TALLAS ↗
        </Link>
      </div>
    </section>
  );
}
export function FaqSection() {
  return (
    <section className="faq-section section-pad">
      <div className="commerce-heading">
        <div>
          <p className="section-label">ANTES DE COMPRAR</p>
          <h2>PREGUNTAS<br />FRECUENTES</h2>
        </div>
      </div>
      <div className="faq-list">
        {FAQ.map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
