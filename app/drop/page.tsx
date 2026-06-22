import { PageFrame } from "@/components/PageFrame";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { products } from "@/data/products";
import Link from "next/link";

export const metadata = { title: "Drop 001" };
export default function Drop() { return <PageFrame>
  <section className="page-hero drop-hero"><div className="page-index">01—03</div><p className="eyebrow">LIMITED RELEASE / PUEBLA MX</p><h1>DROP 001<span>— AFTER DARK</span></h1><div className="page-intro"><p>18 playeras. 3 diseños.<br />6 piezas por diseño.</p><span>AD/001 — SS26</span></div></section>
  <section className="drop-list section-pad"><div className="section-head"><p className="section-label">DROP LIMITADO / 18 PLAYERAS</p><p>$359 MXN CADA UNA<br />6 POR CADA DISEÑO</p></div><div className="product-grid">{products.map((p,i) => <ProductCard key={p.slug} product={p} index={i} />)}</div></section>
  <section className="custom-design section-pad"><div><p className="section-label">04 / HECHO PARA TI</p><h2>¿TIENES UNA IDEA?<br /><em>LA HACEMOS PLAYERA.</em></h2></div><div className="custom-design-copy"><p>También realizamos diseños personalizados. Cuéntanos tu idea, referencias, colores y talla para comenzar tu pedido.</p><Link className="btn primary" href="/contact?piece=custom-design">PEDIR DISEÑO PERSONALIZADO ↗</Link></div></section>
  <section className="details-band"><Reveal><p>HEAVY COTTON</p></Reveal><Reveal delay={.1}><p>OVERSIZED FIT</p></Reveal><Reveal delay={.2}><p>MADE IN MEXICO</p></Reveal><Reveal delay={.3}><p>LIMITED UNIT</p></Reveal></section>
</PageFrame> }
