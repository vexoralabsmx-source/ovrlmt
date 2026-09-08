import { PolicyPage } from "@/components/PolicyPage";
export const metadata = { title: "Privacidad", description: "Información sobre los datos utilizados para gestionar tu pedido y atención en OVRLMT.", alternates: { canonical: "/privacidad" } };
export default function Privacy() { return <PolicyPage code="POLICY / PRIVACY" title="PRIVACIDAD" intro="Tus datos se manejan únicamente para completar tu compra." items={["Los datos se usan únicamente para confirmar pedidos y envíos.", "OVRLMT no vende ni comparte información del cliente con fines comerciales."]} />; }
