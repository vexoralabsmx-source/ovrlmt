import { Suspense } from "react";
import Link from "next/link";
import { PageFrame } from "@/components/PageFrame";
import { PreorderForm } from "@/components/PreorderForm";

export const metadata = { title: "Preorder" };
export default function Contact() { return <PageFrame>
  <section className="contact-page"><div className="contact-copy"><p className="eyebrow">PRIVATE ACCESS / DROP 001</p><h1>JOIN THE<br /><em>PREORDER.</em></h1><p>Sé de los primeros en conseguir DROP 001. Completa tus datos y finaliza tu solicitud directamente por WhatsApp.</p><div className="contact-meta"><div><span>RESPONSE TIME</span><p>24—48 HRS</p></div><div><span>CHANNEL</span><Link href="https://instagram.com/ovrlmt.mx" target="_blank">@OVRLMT.MX ↗</Link></div></div></div><div className="form-shell"><div className="form-top"><span>PREORDER FORM</span><span>SECURE / WHATSAPP</span></div><Suspense fallback={<div>CARGANDO...</div>}><PreorderForm /></Suspense></div></section>
</PageFrame> }
