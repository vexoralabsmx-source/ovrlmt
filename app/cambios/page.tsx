import { PolicyPage } from "@/components/PolicyPage";
import { POLICIES } from "@/data/commerce";
export const metadata = {
  title: "Cambios y atención posventa",
  description:
    "Consulta cómo solicitar correcciones de talla, atención por defectos y cancelaciones de tu pedido OVRLMT.",
  alternates: { canonical: "/cambios" },
};
export default function Changes() {
  return (
    <PolicyPage
      code="ATENCIÓN POSVENTA"
      title="CAMBIOS"
      intro="Revisa talla, dirección y producto antes de pagar. Para cualquier solicitud, conserva tu número de pedido."
      items={[
        POLICIES.sizes,
        POLICIES.defects,
        POLICIES.cancellations,
        "Conserva fotos del problema y evita lavar o modificar la prenda mientras revisamos tu caso.",
        "Te comunicaremos la solución correspondiente por WhatsApp o desde tu cuenta.",
      ]}
    />
  );
}
