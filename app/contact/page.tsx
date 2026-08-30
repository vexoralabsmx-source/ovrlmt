import Link from "next/link";
import { PageFrame } from "@/components/PageFrame";
import { PreorderForm } from "@/components/PreorderForm";
import { FaqSection, HowToBuy, TrustSection } from "@/components/CommerceSections";

export const metadata = { title: "Pedidos y contacto · OVRLMT", description: "Compra tu pieza OVRLMT producida sobre pedido y recibe atención directa." };

export default async function Contact({ searchParams }: { searchParams: Promise<{ piece?: string }> }) {
  const { piece } = await searchParams;
  return <PageFrame>
    <section className="contact-page"><div className="contact-copy"><p className="eyebrow">MADE TO ORDER / OVRLMT</p><h1>PEDIDOS<br /><em>Y CONTACTO.</em></h1><p>Todo se produce sobre pedido. Confirma tu compra por Clip o WhatsApp y comenzamos la producción de tu pieza.</p><div className="contact-meta"><div><span>CONFIRMACIÓN</span><p>VÍA WHATSAPP / CLIP</p></div><div><span>ATENCIÓN DIRECTA</span><Link href="mailto:contacto@ovrlmt.xyz">CONTACTO@OVRLMT.XYZ ↗</Link><Link href="https://instagram.com/ovrlmt.mx" target="_blank" rel="noreferrer">@OVRLMT.MX ↗</Link></div></div></div><div className="form-shell"><div className="form-top"><span>ORDER FORM</span><span>SECURE / API</span></div><PreorderForm initialProduct={piece} /></div></section>
    <HowToBuy /><TrustSection /><FaqSection />
  </PageFrame>;
}
