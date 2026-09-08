import Link from "next/link";
import { POLICIES } from "@/data/commerce";
import { WHATSAPP_NUMBER } from "@/data/store";
export function SizeGuideContent() {
  return (
    <div className="size-guide-content">
      <p className="size-labels">CH / M / G / XG</p>
      <p>
        Las medidas varían entre playeras y sudaderas. Confirma las medidas de
        tu modelo antes de elegir talla.
      </p>
      <ol>
        <li>
          Extiende una prenda similar sobre una superficie plana, sin estirarla.
        </li>
        <li>Mide el ancho de axila a axila.</li>
        <li>Mide el largo desde el hombro hasta el borde inferior.</li>
        <li>Envíanos el modelo y ambas medidas para ayudarte a elegir.</li>
      </ol>
      <p>{POLICIES.sizes}</p>
      <Link
        className="btn ghost"
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, quiero confirmar las medidas y talla de una pieza OVRLMT.")}`}
        target="_blank"
        rel="noreferrer"
      >
        CONSULTAR MI TALLA ↗
      </Link>
    </div>
  );
}
