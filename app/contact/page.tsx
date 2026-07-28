import Link from "next/link";
import { PageFrame } from "@/components/PageFrame";
import { PreorderForm } from "@/components/PreorderForm";
import { FaqSection, HowToBuy, TrustSection } from "@/components/CommerceSections";

export const metadata = { title: "Preorder Drop 001", description: "Aparta tu pieza OVRLMT producida sobre pedido directamente por WhatsApp." };

export default async function Contact({ searchParams }: { searchParams: Promise<{ piece?: string }> }) {
  const { piece } = await searchParams;
  return <PageFrame>
    <section className="contact-page"><div className="contact-copy"><p className="eyebrow">MADE TO ORDER / DROP 001</p><h1>PREORDER<br /><em>DROP 001.</em></h1><p>Todo se produce sobre pedido. Aparta tu cupo, confirma el pago por WhatsApp y comenzamos la producción de tu playera.</p><div className="contact-meta"><div><span>CONFIRMACIÓN</span><p>VÍA WHATSAPP</p></div><div><span>ATENCIÓN DIRECTA</span><Link href="mailto:contacto@ovrlmt.xyz">CONTACTO@OVRLMT.XYZ ↗</Link><Link href="https://instagram.com/ovrlmt.mx" target="_blank" rel="noreferrer">@OVRLMT.MX ↗</Link></div></div></div><div className="form-shell"><div className="form-top"><span>PREORDER FORM</span><span>SECURE / API</span></div><PreorderForm initialProduct={piece} /></div></section>
    <HowToBuy /><TrustSection /><FaqSection />
  </PageFrame>;
}
