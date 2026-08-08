import Link from "next/link";
import { PageFrame } from "@/components/PageFrame";
import { PreorderForm } from "@/components/PreorderForm";
import { FaqSection, HowToBuy, TrustSection } from "@/components/CommerceSections";

export const metadata = { title: "Preorder — Drops 002 & 003 · OVRLMT", description: "Aparta tu pieza OVRLMT producida sobre pedido directamente por WhatsApp o Clip." };

export default async function Contact({ searchParams }: { searchParams: Promise<{ piece?: string }> }) {
  const { piece } = await searchParams;
  return <PageFrame>
    <section className="contact-page"><div className="contact-copy"><p className="eyebrow">MADE TO ORDER / DROPS 002 &amp; 003</p><h1>PREORDER<br /><em>DROPS 002 &amp; 003.</em></h1><p>Todo se produce sobre pedido. Aparta tu cupo, confirma el pago por Clip o WhatsApp y comenzamos la producción de tu playera.</p><div className="contact-meta"><div><span>CONFIRMACIÓN</span><p>VÍA WHATSAPP / CLIP</p></div><div><span>ATENCIÓN DIRECTA</span><Link href="mailto:contacto@ovrlmt.xyz">CONTACTO@OVRLMT.XYZ ↗</Link><Link href="https://instagram.com/ovrlmt.mx" target="_blank" rel="noreferrer">@OVRLMT.MX ↗</Link></div></div></div><div className="form-shell"><div className="form-top"><span>PREORDER FORM</span><span>SECURE / API</span></div><PreorderForm initialProduct={piece} /></div></section>
    <HowToBuy /><TrustSection /><FaqSection />
  </PageFrame>;
}

