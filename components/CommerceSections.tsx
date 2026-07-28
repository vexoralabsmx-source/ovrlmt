import { CheckCircle2, CreditCard, Instagram, MessageCircle, PackageCheck, Truck } from "lucide-react";

export function HowToBuy() {
  const steps = ["Elige tu diseño y talla.", "Agrégalo al carrito o envíalo por WhatsApp.", "Realiza el pago por transferencia.", "Manda tu comprobante.", "Recibe confirmación e iniciamos la producción."];
  return <section className="how-to-buy section-pad"><p className="section-label">HOW TO ORDER / 005</p><div className="commerce-heading"><h2>CÓMO<br />COMPRAR</h2><p>Todo se produce sobre pedido. Tu pieza entra a producción después de confirmar el pago.</p></div><ol>{steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol><p className="commerce-note">No manejamos producto listo para entrega. Revisa tu talla antes de confirmar: después de iniciar producción no hay cambios por error de talla.</p></section>;
}

export function TrustSection() {
  const items = [
    [MessageCircle, "Preventa confirmada por WhatsApp"], [CreditCard, "Pago por transferencia BBVA"],
    [PackageCheck, "Producción sobre pedido"], [CheckCircle2, "Pedido validado con comprobante"],
    [Instagram, "Atención directa por Instagram"], [Truck, "Envío nacional y entrega local"],
  ] as const;
  return <section className="trust-section section-pad"><div className="commerce-heading"><div><p className="section-label">SECURE ORDER / 006</p><h2>COMPRA SEGURA</h2></div><p>Preventa clara, atención directa y seguimiento hasta confirmar tu pieza.</p></div><div className="trust-grid">{items.map(([Icon, label]) => <article key={label}><Icon size={22} strokeWidth={1.4} /><p>{label}</p></article>)}</div></section>;
}

export function SocialProofSection() {
  const items = ["Primer drop limitado: 18 piezas totales.", "Producción local en Puebla, México.", "Atención directa antes y después del pago.", "Cada pedido queda registrado por WhatsApp."];
  return <section className="proof-section section-pad"><div className="commerce-heading"><div><p className="section-label">BRAND SIGNAL / 007</p><h2>TIENDA<br />EN SERIO</h2></div><p>OVRLMT opera por drops limitados, pagos verificados y comunicación directa para que sepas exactamente qué estás comprando.</p></div><div className="proof-grid">{items.map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></article>)}</div></section>;
}

export function FaqSection() {
  const items = [
    ["¿Tienen piezas listas para entrega inmediata?", "No. Todo OVRLMT se produce sobre pedido. La producción de tu pieza inicia después de validar el pago y el comprobante por WhatsApp."],
    ["¿Cuándo se confirma mi pedido?", "Cuando OVRLMT recibe tu comprobante de transferencia y valida el total por WhatsApp."],
    ["¿Cómo sé si aplica entrega gratis en Puebla?", "Ingresa tu código postal en checkout. Si entra en Puebla Centro o alrededores, el sistema marca entrega personal gratis."],
    ["¿El envío gratis aplica en todo México?", "Sí, el envío nacional es gratis en pedidos desde $1,500 MXN. Si tu compra es menor y no aplica entrega local, el envío nacional cuesta $150 MXN."],
    ["¿Puedo cambiar talla?", "Solo antes de confirmar pago. Después de confirmar la preorden, cambios por talla no aplican porque la producción se aparta con esa medida."],
    ["¿Qué pasa si hay defecto de producción?", "Se revisa por WhatsApp con fotos dentro de las primeras 48 horas después de recibir la pieza."],
    ["¿Puedo cancelar mi preorden?", "Una vez confirmado el pago, la preorden entra a producción/apartado y no se cancela salvo un caso acordado directamente con OVRLMT."],
  ];
  return <section className="faq-section section-pad"><div className="commerce-heading"><div><p className="section-label">FAQ / 008</p><h2>PREGUNTAS<br />FRECUENTES</h2></div><p>Información directa para comprar sin dudas antes de pagar.</p></div><div className="faq-list">{items.map(([question, answer], index) => <article key={question}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{question}</h3><p>{answer}</p></div></article>)}</div></section>;
}
