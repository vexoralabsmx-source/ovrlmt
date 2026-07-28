"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Copy,
  CreditCard,
  Landmark,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useCart, type CartItem } from "@/components/CartProvider";
import {
  FREE_SHIPPING_MINIMUM,
  PAYMENT_DETAILS,
  PRODUCT_PRICE,
  SHIPPING_COST,
  WHATSAPP_NUMBER,
} from "@/data/store";

type Step = 1 | 2 | 3;
type PaymentMethod = "clip" | "transfer";

type CheckoutData = {
  email: string;
  fullName: string;
  whatsapp: string;
  city: string;
  state: string;
  postalCode: string;
  address: string;
};

type SuccessOrder = {
  code: string;
  total: number;
  shipping: number;
  items: CartItem[];
  customer: CheckoutData;
  paymentMethod: PaymentMethod;
  receiptNo?: string | null;
  whatsappUrl?: string;
};

type PendingClipOrder = Omit<SuccessOrder, "paymentMethod" | "receiptNo" | "whatsappUrl"> & {
  paymentRequestId: string;
};

const CLIP_PENDING_KEY = "ovrlmt-clip-pending-v1";
const emptyData: CheckoutData = {
  email: "",
  fullName: "",
  whatsapp: "",
  city: "",
  state: "",
  postalCode: "",
  address: "",
};

const steps: Array<{ id: Step; label: string; icon: typeof Mail }> = [
  { id: 1, label: "Identificación", icon: Mail },
  { id: 2, label: "Dirección", icon: MapPin },
  { id: 3, label: "Pago seguro", icon: LockKeyhole },
];

const money = (value: number) => `$${value.toLocaleString("es-MX")} MXN`;
const isLocalPostalCode = (postalCode: string) => /^(72|73|74)/.test(postalCode.replace(/\D/g, ""));
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

function getShipping(subtotal: number, postalCode: string) {
  const cleanPostalCode = postalCode.replace(/\D/g, "");
  if (subtotal <= 0 || subtotal >= FREE_SHIPPING_MINIMUM) return 0;
  if (cleanPostalCode.length === 5 && isLocalPostalCode(cleanPostalCode)) return 0;
  return SHIPPING_COST;
}

function StepPanel({ children, stepKey }: { children: ReactNode; stepKey: string }) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function CartPage() {
  const cart = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkedClipReturn = useRef(false);
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<CheckoutData>(emptyData);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutData, string>>>({});
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("clip");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [clipReturnState, setClipReturnState] = useState<"idle" | "checking" | "pending" | "error">("idle");
  const [successOrder, setSuccessOrder] = useState<SuccessOrder | null>(null);

  const cleanPostalCode = data.postalCode.replace(/\D/g, "");
  const localDelivery = cleanPostalCode.length === 5 && isLocalPostalCode(cleanPostalCode);
  const shipping = getShipping(cart.subtotal, cleanPostalCode);
  const total = cart.subtotal + shipping;
  const shippingLabel = localDelivery
    ? "Entrega personal gratis"
    : shipping === 0
      ? "Envío gratis"
      : "Envío nacional estándar";
  const itemSummary = cart.items.map((item) => `${item.quantity}x ${item.name} talla ${item.size}`).join(", ");

  const paymentText = useMemo(() => [
    `Banco: ${PAYMENT_DETAILS.bank}`,
    `Titular: ${PAYMENT_DETAILS.accountHolder}`,
    `Tarjeta/CLABE: ${PAYMENT_DETAILS.account}`,
    `Monto exacto: ${money(total)}`,
    PAYMENT_DETAILS.instructions,
  ].join("\n"), [total]);

  useEffect(() => {
    const returnType = searchParams.get("clip");
    if (!returnType || checkedClipReturn.current) return;
    checkedClipReturn.current = true;

    if (returnType === "error") {
      setStep(3);
      setPaymentMethod("clip");
      setPaymentError("Clip no completó el cobro. No se realizó ningún cargo; puedes intentarlo otra vez.");
      setClipReturnState("error");
      router.replace("/cart", { scroll: false });
      return;
    }

    let pending: PendingClipOrder | null = null;
    try {
      const saved = sessionStorage.getItem(CLIP_PENDING_KEY);
      pending = saved ? JSON.parse(saved) as PendingClipOrder : null;
    } catch {
      pending = null;
    }

    if (!pending?.paymentRequestId) {
      setClipReturnState("error");
      setPaymentError("No encontramos la referencia del pago. Escríbenos si el cargo aparece en tu tarjeta.");
      return;
    }

    setClipReturnState("checking");
    fetch(`/api/clip/checkout/${encodeURIComponent(pending.paymentRequestId)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as {
          paid?: boolean;
          receiptNo?: string | null;
          error?: string;
        };
        if (!response.ok) throw new Error(result.error || "No pudimos confirmar el pago.");
        if (!result.paid) {
          setClipReturnState("pending");
          return;
        }

        setSuccessOrder({
          code: pending.code,
          total: pending.total,
          shipping: pending.shipping,
          items: pending.items,
          customer: pending.customer,
          paymentMethod: "clip",
          receiptNo: result.receiptNo,
        });
        sessionStorage.removeItem(CLIP_PENDING_KEY);
        cart.clearCart();
        setClipReturnState("idle");
        router.replace("/cart", { scroll: false });
      })
      .catch((error: unknown) => {
        setClipReturnState("error");
        setPaymentError(error instanceof Error ? error.message : "No pudimos confirmar el pago todavía.");
      });
  }, [cart, router, searchParams]);

  function updateField(field: keyof CheckoutData, value: string) {
    const nextValue = field === "postalCode" ? value.replace(/\D/g, "").slice(0, 5) : value;
    setData((current) => ({ ...current, [field]: nextValue }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: "" }));
  }

  function validateStepOne() {
    if (isValidEmail(data.email)) return true;
    setErrors({ email: "Ingresa un correo válido." });
    return false;
  }

  function validateStepTwo() {
    const nextErrors: Partial<Record<keyof CheckoutData, string>> = {};
    if (!data.fullName.trim()) nextErrors.fullName = "Nombre obligatorio.";
    if (!data.whatsapp.trim()) nextErrors.whatsapp = "WhatsApp obligatorio.";
    if (!data.city.trim()) nextErrors.city = "Ciudad obligatoria.";
    if (!data.state.trim()) nextErrors.state = "Estado obligatorio.";
    if (!/^\d{5}$/.test(cleanPostalCode)) nextErrors.postalCode = "CP de 5 dígitos.";
    if (!data.address.trim()) nextErrors.address = "Dirección completa obligatoria.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goToStep(nextStep: Step) {
    setStep(nextStep);
    setPaymentError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueToShipping() {
    if (validateStepOne()) goToStep(2);
  }

  function continueToPayment() {
    if (validateStepTwo()) goToStep(3);
  }

  async function copyPayment() {
    await navigator.clipboard.writeText(paymentText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function startClipCheckout() {
    setIsSubmitting(true);
    setPaymentError("");
    try {
      const response = await fetch("/api/clip/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: data,
          items: cart.items.map(({ slug, size, quantity }) => ({ slug, size, quantity })),
        }),
      });
      const result = await response.json() as {
        orderCode?: string;
        totalMxn?: number;
        paymentRequestId?: string;
        paymentUrl?: string;
        error?: string;
        detail?: string;
      };
      if (!response.ok || !result.paymentUrl || !result.paymentRequestId || !result.orderCode) {
        throw new Error(result.detail || result.error || "No pudimos abrir Clip.");
      }

      const pendingOrder: PendingClipOrder = {
        paymentRequestId: result.paymentRequestId,
        code: result.orderCode,
        total: Number(result.totalMxn ?? total),
        shipping,
        items: [...cart.items],
        customer: data,
      };
      sessionStorage.setItem(CLIP_PENDING_KEY, JSON.stringify(pendingOrder));
      window.location.assign(result.paymentUrl);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "No pudimos iniciar el pago.");
      setIsSubmitting(false);
    }
  }

  async function confirmOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStepTwo()) {
      goToStep(2);
      return;
    }
    if (paymentMethod === "clip") {
      await startClipCheckout();
      return;
    }

    const orderCode = `OV-${Math.floor(1000 + Math.random() * 9000)}`;
    const message = `Hola, quiero confirmar mi preorden ${orderCode}. Cliente: ${data.fullName}. Prendas: ${itemSummary}. Total: ${money(total)}. Adjunto mi comprobante.`;
    setSuccessOrder({
      code: orderCode,
      total,
      shipping,
      items: [...cart.items],
      customer: data,
      paymentMethod: "transfer",
      whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
    });
    cart.clearCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (successOrder) {
    const paidWithClip = successOrder.paymentMethod === "clip";
    return (
      <section className="checkout-success checkout-success-premium">
        <motion.div initial={{ scale: 0.82, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="success-mark">
          <Check size={34} />
        </motion.div>
        <p className="eyebrow">{paidWithClip ? "PAYMENT CONFIRMED" : "ORDER LOCKED"} / {successOrder.code}</p>
        <h1>{paidWithClip ? <>PAGO<br />LISTO.</> : <>PIEZA<br />APARTADA.</>}</h1>
        <p>
          {paidWithClip
            ? <>Clip confirmó tu pago. Tu orden <b>{successOrder.code}</b> entra al flujo de producción sobre pedido.</>
            : <>Tu preorden quedó registrada. Transfiere el monto exacto y envía el comprobante para activar el seguimiento.</>}
        </p>
        <div className="success-order-card">
          <div><span>MONTO FINAL</span><strong>{money(successOrder.total)}</strong></div>
          <div><span>MÉTODO</span><strong>{paidWithClip ? "Tarjeta / Clip" : "Transferencia"}</strong></div>
          <div><span>ESTADO</span><strong>{paidWithClip ? "Pagado" : "Por confirmar"}</strong></div>
          <div><span>{paidWithClip ? "RECIBO" : "BANCO"}</span><strong>{paidWithClip ? successOrder.receiptNo || "Confirmado por Clip" : PAYMENT_DETAILS.bank}</strong></div>
        </div>
        <div className="success-products">
          {successOrder.items.map((item) => (
            <span key={`${item.slug}-${item.size}`}>{item.quantity}x {item.name} / talla {item.size}</span>
          ))}
        </div>
        <div>
          {!paidWithClip && successOrder.whatsappUrl && (
            <a className="btn primary" href={successOrder.whatsappUrl} target="_blank" rel="noreferrer">
              ENVIAR COMPROBANTE POR WHATSAPP <span>↗</span>
            </a>
          )}
          <Link className={paidWithClip ? "btn primary" : "btn ghost"} href="/login">IR AL TRACKING</Link>
        </div>
      </section>
    );
  }

  if (clipReturnState === "checking" || clipReturnState === "pending") {
    return (
      <section className="checkout-success checkout-success-premium clip-return-state">
        <LoaderCircle className="clip-spinner" size={46} />
        <p className="eyebrow">CLIP / PAYMENT STATUS</p>
        <h1>{clipReturnState === "checking" ? <>CONFIRMANDO<br />PAGO.</> : <>PAGO EN<br />PROCESO.</>}</h1>
        <p>
          {clipReturnState === "checking"
            ? "Estamos consultando directamente con Clip. No cierres esta ventana."
            : "Clip todavía está procesando la operación. Tu carrito sigue guardado; vuelve a consultar en unos segundos."}
        </p>
        {clipReturnState === "pending" && (
          <button className="btn primary" type="button" onClick={() => window.location.reload()}>CONSULTAR DE NUEVO</button>
        )}
      </section>
    );
  }

  if (!cart.items.length) {
    return (
      <section className="cart-page cart-page-empty">
        <ShoppingBag size={42} />
        <p className="eyebrow">ORDER SYSTEM / EMPTY</p>
        <h1>TU CARRITO<br />ESTÁ VACÍO.</h1>
        <p>Explora el drop activo y selecciona diseño, talla y cantidad antes de pasar a checkout.</p>
        <Link className="btn primary" href="/drop">VER DROP <span>↗</span></Link>
      </section>
    );
  }

  return (
    <section className="cart-page checkout-flow checkout-premium">
      <header className="checkout-premium-head">
        <div>
          <p className="eyebrow">SECURE CHECKOUT / OVRLMT</p>
          <h1>CHECKOUT<br />NOCTURNO.</h1>
          <p className="checkout-order-note"><strong>TODO ES SOBRE PEDIDO.</strong> La producción inicia después de validar tu pago.</p>
        </div>
        <div className="checkout-progress checkout-progress-steps" aria-label="Progreso del checkout">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const active = step >= item.id;
            return (
              <div className="progress-fragment" key={item.id}>
                {index > 0 && <i className={active ? "active" : ""} />}
                <span className={active ? "active" : ""}><Icon size={14} /> 0{item.id} {item.label}</span>
              </div>
            );
          })}
        </div>
      </header>

      <form className="checkout-premium-grid" onSubmit={confirmOrder}>
        <main className="checkout-step-surface">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepPanel stepKey="email">
                <section className="checkout-card email-step">
                  <p className="section-label">01 / IDENTIFICACIÓN</p>
                  <h2>Correo para confirmar tu orden.</h2>
                  <p>Todos los datos del checkout son obligatorios. Usaremos este correo para enviarte confirmación, seguimiento y actualizaciones de tu pieza.</p>
                  <label>
                    <span>CORREO ELECTRÓNICO *</span>
                    <input required aria-required="true" value={data.email} onChange={(event) => updateField("email", event.target.value)} type="email" autoComplete="email" placeholder="cliente@correo.com" />
                    {errors.email && <small>{errors.email}</small>}
                  </label>
                  <button className="checkout-next" type="button" onClick={continueToShipping}>CONTINUAR AL ENVÍO <span>↗</span></button>
                </section>
              </StepPanel>
            )}

            {step === 2 && (
              <StepPanel stepKey="address">
                <section className="checkout-card address-step">
                  <button className="checkout-back" type="button" onClick={() => goToStep(1)}><ArrowLeft size={14} /> VOLVER</button>
                  <p className="section-label">02 / DIRECCIÓN Y CONTACTO</p>
                  <h2>Entrega sin fricción.</h2>
                  <p>Completa todos los campos. Son obligatorios para procesar el pago y entregar tu pedido.</p>
                  <div className="checkout-fields-grid">
                    <label className="wide"><span>NOMBRE COMPLETO *</span><input required aria-required="true" value={data.fullName} onChange={(event) => updateField("fullName", event.target.value)} autoComplete="name" />{errors.fullName && <small>{errors.fullName}</small>}</label>
                    <label><span>TELÉFONO WHATSAPP *</span><input required aria-required="true" value={data.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} type="tel" autoComplete="tel" />{errors.whatsapp && <small>{errors.whatsapp}</small>}</label>
                    <label><span>CÓDIGO POSTAL *</span><input required aria-required="true" value={data.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} inputMode="numeric" pattern="\d{5}" minLength={5} maxLength={5} />{errors.postalCode && <small>{errors.postalCode}</small>}</label>
                    <label><span>CIUDAD *</span><input required aria-required="true" value={data.city} onChange={(event) => updateField("city", event.target.value)} autoComplete="address-level2" />{errors.city && <small>{errors.city}</small>}</label>
                    <label><span>ESTADO *</span><input required aria-required="true" value={data.state} onChange={(event) => updateField("state", event.target.value)} autoComplete="address-level1" />{errors.state && <small>{errors.state}</small>}</label>
                    <label className="wide"><span>DIRECCIÓN COMPLETA *</span><input required aria-required="true" value={data.address} onChange={(event) => updateField("address", event.target.value)} autoComplete="street-address" placeholder="Calle, número, colonia y referencias" />{errors.address && <small>{errors.address}</small>}</label>
                  </div>
                  {cleanPostalCode.length === 5 && (
                    <div className={`delivery-result ${localDelivery ? "personal" : "national"}`}>
                      <MapPin size={20} />
                      <div>
                        <b>{localDelivery ? "ENTREGA PERSONAL GRATIS DISPONIBLE" : shipping === 0 ? "ENVÍO NACIONAL GRATIS" : "ENVÍO NACIONAL ESTÁNDAR ($150 MXN)"}</b>
                        <p>{localDelivery ? "Acordaremos el punto de entrega en Puebla por WhatsApp." : shipping === 0 ? "Tu compra supera el mínimo de envío gratis." : "Se suma la tarifa nacional estándar al total."}</p>
                      </div>
                    </div>
                  )}
                  <div className="checkout-controls">
                    <button className="checkout-back secondary-control" type="button" onClick={() => goToStep(1)}>VOLVER</button>
                    <button className="checkout-next" type="button" onClick={continueToPayment}>CONTINUAR AL PAGO <span>↗</span></button>
                  </div>
                </section>
              </StepPanel>
            )}

            {step === 3 && (
              <StepPanel stepKey="payment">
                <section className="checkout-card payment-step-card">
                  <button className="checkout-back" type="button" disabled={isSubmitting} onClick={() => goToStep(2)}><ArrowLeft size={14} /> VOLVER</button>
                  <p className="section-label">03 / ELIGE CÓMO PAGAR</p>
                  <div className="payment-methods" role="radiogroup" aria-label="Método de pago">
                    <button className={paymentMethod === "clip" ? "active" : ""} type="button" role="radio" aria-checked={paymentMethod === "clip"} onClick={() => { setPaymentMethod("clip"); setPaymentError(""); }}>
                      <CreditCard size={21} /><span><b>TARJETA CON CLIP</b><small>Crédito o débito</small></span><ShieldCheck size={17} />
                    </button>
                    <button className={paymentMethod === "transfer" ? "active" : ""} type="button" role="radio" aria-checked={paymentMethod === "transfer"} onClick={() => { setPaymentMethod("transfer"); setPaymentError(""); }}>
                      <Landmark size={21} /><span><b>TRANSFERENCIA BBVA</b><small>Confirmación manual</small></span>
                    </button>
                  </div>

                  {paymentMethod === "clip" ? (
                    <div className="payment-card premium-bank-card clip-payment-card">
                      <div className="payment-card-top"><p className="section-label">CLIP / CHECKOUT SEGURO</p><span>VISA · MC · AMEX</span></div>
                      <ShieldCheck className="bank-watermark" size={92} />
                      <h2>PAGA CON<br />TARJETA.</h2>
                      <p>Te enviaremos al checkout seguro de Clip. OVRLMT no ve ni almacena los datos de tu tarjeta.</p>
                      <dl>
                        <div><dt>MÉTODO</dt><dd>Crédito o débito</dd></div>
                        <div><dt>MONEDA</dt><dd>MXN</dd></div>
                        <div><dt>MONTO EXACTO</dt><dd>{money(total)}</dd></div>
                      </dl>
                      {paymentError && <p className="payment-error" role="alert">{paymentError}</p>}
                      <button className="whatsapp-submit pulse-submit" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <><LoaderCircle className="clip-spinner" size={18} /> CREANDO PAGO SEGURO...</> : <>PAGAR CON TARJETA EN CLIP <span>↗</span></>}
                      </button>
                      <small><LockKeyhole size={12} /> Serás redirigido a Clip para completar el pago.</small>
                    </div>
                  ) : (
                    <div className="payment-card premium-bank-card">
                      <div className="payment-card-top"><p className="section-label">TRANSFERENCIA BBVA</p><span>MANUAL / MX</span></div>
                      <CreditCard className="bank-watermark" size={92} />
                      <h2>PAGO<br />MANUAL.</h2>
                      <p>Transfiere el monto exacto. El apartado se activa cuando validamos tu comprobante.</p>
                      <dl>
                        <div><dt>BANCO</dt><dd>{PAYMENT_DETAILS.bank}</dd></div>
                        <div><dt>TITULAR</dt><dd>{PAYMENT_DETAILS.accountHolder}</dd></div>
                        <div><dt>TARJETA / CLABE</dt><dd>{PAYMENT_DETAILS.account}</dd></div>
                        <div><dt>MONTO EXACTO</dt><dd>{money(total)}</dd></div>
                      </dl>
                      <button className="copy-payment" type="button" onClick={copyPayment}>{copied ? <ClipboardCheck size={16} /> : <Copy size={16} />}{copied ? "COPIADO ✓" : "COPIAR DATOS DE TRANSFERENCIA"}</button>
                      <button className="whatsapp-submit" type="submit">APARTAR Y ENVIAR COMPROBANTE <span>↗</span></button>
                    </div>
                  )}
                </section>
              </StepPanel>
            )}
          </AnimatePresence>
        </main>

        <aside className="order-sidebar">
          <div className="order-sidebar-card">
            <div className="cart-page-title">
              <span>RESUMEN / {cart.itemCount} PIEZA{cart.itemCount === 1 ? "" : "S"}</span>
              <button type="button" onClick={cart.clearCart}><Trash2 size={13} /> VACIAR</button>
            </div>
            <div className="sidebar-items">
              {cart.items.map((item) => (
                <article key={`${item.slug}-${item.size}`}>
                  <div className="cart-page-image"><Image src={item.image} alt={item.name} fill sizes="86px" /></div>
                  <div><p>DROP / TALLA {item.size}</p><h3>{item.name}</h3><span>{item.quantity} x {money(item.priceMxn || PRODUCT_PRICE)}</span></div>
                  <strong>{money(item.quantity * (item.priceMxn || PRODUCT_PRICE))}</strong>
                </article>
              ))}
            </div>
            <dl>
              <div><dt>Subtotal</dt><dd>{money(cart.subtotal)}</dd></div>
              <div><dt>{shippingLabel}</dt><dd>{shipping === 0 ? "GRATIS" : money(shipping)}</dd></div>
              <div><dt>Total a pagar</dt><dd>{money(total)}</dd></div>
            </dl>
            <div className="sidebar-trust-note"><ShieldCheck size={17} /><span>Pago protegido por Clip. Los datos de tu tarjeta no pasan por OVRLMT.</span></div>
            {cart.subtotal < FREE_SHIPPING_MINIMUM && !localDelivery && <p className="shipping-rule">Envío gratis desde {money(FREE_SHIPPING_MINIMUM)} o entrega personal gratis en zonas seleccionadas de Puebla.</p>}
            <div className="sidebar-mini-badges">
              <span><PackageCheck size={13} /> Sobre pedido</span>
              <span><Truck size={13} /> Envío</span>
              <span><UserRound size={13} /> Seguimiento</span>
            </div>
          </div>
        </aside>
      </form>
    </section>
  );
}
