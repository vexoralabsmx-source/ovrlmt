import { PageFrame } from "@/components/PageFrame";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import Link from "next/link";
import { FaqSection, HowToBuy, SocialProofSection, TrustSection } from "@/components/CommerceSections";
import { getCatalogProducts, getStockSummary } from "@/src/lib/catalog";

export const metadata = { title: "Drop 001" };
export const dynamic = "force-dynamic";

export default async function Drop() {
  const products = await getCatalogProducts();
  const totalAvailable = products.reduce((sum, product) => sum + getStockSummary(product).available, 0);

  return <PageFrame>
  <section className="page-hero drop-hero"><div className="page-index">01—03</div><p className="eyebrow">MADE TO ORDER / PUEBLA MX</p><h1>DROP 001<span>— AFTER DARK</span></h1><div className="page-intro"><p>18 cupos de producción.<br />3 diseños. 6 por diseño.</p><span>SOBRE PEDIDO — AD/001</span></div></section>
  <section className="drop-list section-pad"><div className="section-head"><p className="section-label">DROP LIMITADO / {totalAvailable} CUPOS DISPONIBLES</p><p>PRODUCCIÓN SOBRE PEDIDO<br />REFERENCIAS VISUALES</p></div><div className="product-grid">{products.map((p,i) => <ProductCard key={p.slug} product={p} index={i} />)}</div></section>
  <HowToBuy />
  <section className="custom-design section-pad"><div><p className="section-label">04 / HECHO PARA TI</p><h2>¿TIENES UNA IDEA?<br /><em>LA HACEMOS PLAYERA.</em></h2></div><div className="custom-design-copy"><p>También realizamos diseños personalizados. Cuéntanos tu idea, referencias, colores y talla para comenzar tu pedido.</p><Link className="btn primary" href="/contact?piece=custom-design">PEDIR DISEÑO PERSONALIZADO ↗</Link></div></section>
  <section className="details-band"><Reveal><p>PREMIUM QUALITY</p></Reveal><Reveal delay={.1}><p>PREMIUM FIT</p></Reveal><Reveal delay={.2}><p>MADE IN MEXICO</p></Reveal><Reveal delay={.3}><p>LIMITED UNIT</p></Reveal></section>
  <SocialProofSection />
  <TrustSection />
  <FaqSection />
</PageFrame>;
}
