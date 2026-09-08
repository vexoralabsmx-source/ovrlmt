import { Suspense } from "react";
import { getCatalogProducts } from "@/src/lib/catalog";
import { CURRENT_DROP_URL, isCurrentDrop } from "@/data/commerce";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { HeroScene } from "@/components/HeroScene";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { NaomiDropShowcase } from "@/components/NaomiDropShowcase";
import { NextDropTeaser } from "@/components/NextDropTeaser";
import { FaqSection, HowToBuy, SocialProofSection, TrustSection, QualitySection, SizeSummary } from "@/components/CommerceSections";

export const dynamic = "force-dynamic";

async function CurrentDropContent() {
  const products = (await getCatalogProducts()).filter(isCurrentDrop).slice(0, 3);
  return <NaomiDropShowcase products={products} />;
}
async function ProductQuality() {
  const products = (await getCatalogProducts()).filter(isCurrentDrop).slice(0, 3);
  return <QualitySection products={products} />;
}

export default function Home() {

  return (
    <PageFrame>
      <section className="hero">
        <div className="hero-glow" />
        <HeroScene />
        <div className="hero-kicker">
          <span>EST. 2026</span>
          <span>PUEBLA / MEXICO</span>
        </div>
        <div className="hero-content">
          <p className="eyebrow">
            STREETWEAR SYSTEM / DROP 004 <i />
          </p>
          <div className="hero-logo-wrap">
            <Image
              className="hero-brand-logo"
              src="/brand/ovrlmt-logo.png"
              alt="OVRLMT"
              width={2048}
              height={682}
              priority
            />
          </div>
          <div className="hero-sub">
            <h1>BUILT AFTER DARK</h1>
            <p>
              Streetwear premium producido sobre pedido,
              <br /> inspirado en velocidad, noche y cultura urbana.
            </p>
          </div>
          <div className="hero-actions">
            <Link className="btn primary" href="/drop">
              VER DROPS <ArrowUpRight size={16} />
            </Link>
            <Link className="btn ghost" href={CURRENT_DROP_URL}>
              COMPRAR AHORA
            </Link>
          </div>
        </div>
        <div className="scroll-mark">
          <span>SCROLL TO BREAK LIMITS</span>
          <ArrowDown size={16} />
        </div>
        <div className="hero-number">01</div>
      </section>

      <Suspense fallback={<div className="drop-loading" />}><CurrentDropContent /></Suspense>

      <NextDropTeaser />

      <HowToBuy />

      <section className="manifesto section-pad">
        <Reveal>
          <p className="section-label">01 / MANIFESTO</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2>
            NO NACIMOS PARA
            <br />
            QUEDARNOS DENTRO
            <br />
            DEL <em>LÍMITE.</em>
          </h2>
        </Reveal>
        <div className="manifesto-copy">
          <Reveal>
            <p>
              OVRLMT combina el pulso del streetwear con la velocidad, el asfalto y la cultura nocturna. Prendas para
              quienes construyen su propio camino.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <span>LIMITS ARE FICTION — DROP 004</span>
          </Reveal>
        </div>
        <div className="speed-line" />
      </section>

      <section className="timeline section-pad">
        <p className="section-label">02 / ORIGIN SYSTEM</p>
        {[
          { n: "01", title: "THE CITY", copy: "Después de medianoche, la ciudad cambia de código." },
          { n: "02", title: "THE SPEED", copy: "Movimiento constante. Ambición sin permiso." },
          { n: "03", title: "THE LIMIT", copy: "Una línea existe hasta que alguien decide cruzarla." },
        ].map((x, i) => (
          <Reveal key={x.title}>
            <article className="timeline-row">
              <span>{x.n}</span>
              <h3>{x.title}</h3>
              <p>{x.copy}</p>
              <i className={i === 1 ? "active" : ""}>↗</i>
            </article>
          </Reveal>
        ))}
      </section>

      <section className="home-cta">
        <div className="cta-road" />
        <p>DROP 004 / NAYIOMI.KO × OVRLMT</p>
        <Reveal>
          <h2>
            NAYIOMI.KO × OVRLMT
            <br />
            <em>COMPRA ABIERTA.</em>
          </h2>
        </Reveal>
        <Link className="btn primary jumbo" href={CURRENT_DROP_URL}>
          COMPRAR AHORA <ArrowUpRight />
        </Link>
        <span className="cta-meta">PRODUCCIÓN SOBRE PEDIDO / DROP 001 AGOTADO</span>
      </section>
      <Suspense fallback={null}><ProductQuality /></Suspense>
      <SizeSummary />
      <SocialProofSection />
      <TrustSection />
      <FaqSection />
    </PageFrame>
  );
}
