import { EnviatodoQuoteWidget } from "@/components/EnviatodoQuoteWidget";
import { PolicyPage } from "@/components/PolicyPage";
import { SHIPPING_COPY, DELIVERY_ESTIMATE } from "@/data/commerce";
import { LOCAL_DELIVERY_COPY } from "@/data/store";
import { publicShippingQuoteEnabled } from "@/src/lib/shippingFeature";
export const metadata = {
  title: "Envíos",
  description:
    "Envío nacional de $150 MXN, gratis desde $1,500 MXN y entrega personal en Puebla. Consulta tiempos de producción y entrega.",
  alternates: { canonical: "/envios" },
};
export default function Shipping() {
  return (
    <PolicyPage
      code="ENTREGA / MÉXICO"
      title="ENVÍOS"
      intro="Información para planear tu compra. Producimos en Puebla y enviamos a México."
      items={[
        SHIPPING_COPY,
        LOCAL_DELIVERY_COPY,
        DELIVERY_ESTIMATE,
        "Consulta tu pedido desde tu cuenta. Al salir, compartimos la guía o confirmación de entrega.",
        "Verifica dirección, código postal y teléfono antes de pagar.",
      ]}
    >
      {publicShippingQuoteEnabled() && <EnviatodoQuoteWidget />}
    </PolicyPage>
  );
}
