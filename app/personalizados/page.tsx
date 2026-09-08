import Link from "next/link";
import { PageFrame } from "@/components/PageFrame";
import { WHATSAPP_NUMBER } from "@/data/store";
export const metadata = {
  title: "Personalizados",
  description:
    "Consulta el servicio de prendas personalizadas de OVRLMT en Puebla.",
  alternates: { canonical: "/personalizados" },
};
export default function Custom() {
  return (
    <PageFrame>
      <section className="page-hero">
        <p className="eyebrow">OVRLMT / SERVICIOS</p>
        <h1>
          TU IDEA.
          <br />
          OTRA FORMA.
        </h1>
        <div className="page-intro">
          <p>
            Prendas personalizadas por encargo.
            <br />
            Cuéntanos tu idea, referencias y cantidad para cotizar.
          </p>
        </div>
      </section>
      <section className="section-pad">
        <p>Materiales, precio y tiempos se acuerdan según cada proyecto.</p>
        <Link
          className="btn primary"
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, quiero consultar un proyecto de prendas personalizadas.")}`}
        >
          CONSULTAR PROYECTO ↗
        </Link>
      </section>
    </PageFrame>
  );
}
