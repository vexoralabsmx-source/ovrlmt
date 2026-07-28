import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { HeroScene } from "@/components/HeroScene";
import { PageFrame } from "@/components/PageFrame";
import { ProductCard } from "@/components/ProductCard";
import { ProductScrollShowcase } from "@/components/ProductScrollShowcase";
import { Reveal } from "@/components/Reveal";
import { getCatalogProducts } from "@/src/lib/catalog";
import { FaqSection, HowToBuy, SocialProofSection, TrustSection } from "@/components/CommerceSections";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getCatalogProducts({ featuredOnly: true });

  return <PageFrame>
    <section className="hero">
      <div className="hero-glow" /><HeroScene />
      <div className="hero-kicker"><span>EST. 2026</span><span>PUEBLA / MEXICO</span></div>
      <div className="hero-content">
        <p className="eyebrow">STREET UNIT 001 <i /></p>
        <div className="hero-logo-wrap"><Image className="hero-brand-logo" src="/brand/ovrlmt-logo.png" alt="OVRLMT" width={2048} height={682} priority /></div>
        <div className="hero-sub"><h2>BUILT AFTER DARK</h2><p>Streetwear premium producido sobre pedido,<br /> inspirado en velocidad, noche y cultura urbana.</p></div>
        <div className="hero-actions"><Link className="btn primary" href="/drop">VER DROP <ArrowUpRight size={16} /></Link><Link className="btn ghost" href="/contact">PREORDENAR AHORA</Link></div>
      </div>
      <div className="scroll-mark"><span>SCROLL TO BREAK LIMITS</span><ArrowDown size={16} /></div>
      <div className="hero-number">01</div>
    </section>

    <HowToBuy />

    <section className="manifesto section-pad">
      <Reveal><p className="section-label">01 / MANIFESTO</p></Reveal>
      <Reveal delay={.08}><h2>NO NACIMOS PARA<br />QUEDARNOS DENTRO<br />DEL <em>LÍMITE.</em></h2></Reveal>
      <div className="manifesto-copy"><Reveal><p>OVRLMT combina el pulso del streetwear con la velocidad, el asfalto y la cultura nocturna. Prendas para quienes construyen su propio camino.</p></Reveal><Reveal delay={.1}><span>LIMITS ARE FICTION — AD/001</span></Reveal></div>
      <div className="speed-line" />
    </section>

    <ProductScrollShowcase products={products} />

    <section className="featured section-pad">
      <div className="section-head"><div><p className="section-label">03 / GARMENT SYSTEM</p><h2>DROP 001</h2></div><p>MADE TO ORDER<br />LIMITED RELEASE</p></div>
      <div className="product-grid">{products.map((p, i) => <ProductCard product={p} index={i} key={p.slug} />)}</div>
    </section>

    <section className="timeline section-pad">
      <p className="section-label">04 / ORIGIN SYSTEM</p>
      {[{ n: "01", title: "THE CITY", copy: "Después de medianoche, la ciudad cambia de código." }, { n: "02", title: "THE SPEED", copy: "Movimiento constante. Ambición sin permiso." }, { n: "03", title: "THE LIMIT", copy: "Una línea existe hasta que alguien decide cruzarla." }].map((x, i) => <Reveal key={x.title}><article className="timeline-row"><span>{x.n}</span><h3>{x.title}</h3><p>{x.copy}</p><i className={i === 1 ? "active" : ""}>↗</i></article></Reveal>)}
    </section>

    <section className="home-cta">
      <div className="cta-road" /><p>DROP CODE: AD-001 / SOBRE PEDIDO</p><Reveal><h2>DROP 001<br /><em>PREORDER OPEN.</em></h2></Reveal><Link className="btn primary jumbo" href="/contact">PREORDENAR AHORA <ArrowUpRight /></Link><span className="cta-meta">PRODUCCIÓN SOBRE PEDIDO / CONFIRMACIÓN DIRECTA</span>
    </section>
    <SocialProofSection />
    <TrustSection />
    <FaqSection />
  </PageFrame>;
}
