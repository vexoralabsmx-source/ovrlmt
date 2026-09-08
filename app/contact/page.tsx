import Link from "next/link";
import { PageFrame } from "@/components/PageFrame";
import { WHATSAPP_NUMBER } from "@/data/store";
export const metadata = {
  title: "Contacto",
  description:
    "Atención OVRLMT en Puebla. Consulta tu pedido, talla o envío por WhatsApp, Instagram o correo.",
  alternates: { canonical: "/contact" },
};
export default function Contact() {
  return (
    <PageFrame>
      <section className="page-hero">
        <p className="eyebrow">PUEBLA, MÉXICO</p>
        <h1>HABLEMOS.</h1>
        <div className="page-intro">
          <p>
            Tu pieza, tu talla o tu pedido.
            <br />
            Estamos para ayudarte.
          </p>
        </div>
      </section>
      <section className="contact-options section-pad">
        <Link className="btn primary" href={`https://wa.me/${WHATSAPP_NUMBER}`}>
          WHATSAPP ↗
        </Link>
        <Link className="btn ghost" href="mailto:contacto@ovrlmt.xyz">
          CONTACTO@OVRLMT.XYZ
        </Link>
        <Link className="btn ghost" href="https://instagram.com/ovrlmt.mx">
          INSTAGRAM ↗
        </Link>
        <Link className="btn ghost" href="/cuenta">
          CONSULTAR MIS PEDIDOS
        </Link>
        <Link className="text-link" href="/personalizados">
          SERVICIO DE PERSONALIZADOS ↗
        </Link>
      </section>
    </PageFrame>
  );
}
