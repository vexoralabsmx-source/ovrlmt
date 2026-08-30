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
  LOCAL_DELIVERY_COPY,
  PAYMENT_DETAILS,
  PRODUCT_PRICE,
  SHIPPING_COST,
  WHATSAPP_NUMBER,
  isFreePersonalDeliveryPostalCode,
} from "@/data/store";

type Step = 1 | 2 | 3;
type PaymentMethod = "clip" | "transfer";
type DeliveryMethod = "personal" | "national";

type CheckoutData = {
  email: string;
  fullName: string;
  company: string;
  whatsapp: string;
  country: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  reference: string;
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
const CHECKOUT_DRAFT_KEY = "ovrlmt-checkout-draft-v1";
const emptyData: CheckoutData = {
  email: "",
  fullName: "",
  company: "",
  whatsapp: "",
  country: "México",
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  neighborhood: "",
  city: "",
  state: "",
  postalCode: "",
  reference: "",
};

const steps: Array<{ id: Step; label: string; icon: typeof Mail }> = [
  { id: 1, label: "Identificación", icon: Mail },
  { id: 2, label: "Dirección", icon: MapPin },
  { id: 3, label: "Pago seguro", icon: LockKeyhole },
];

const money = (value: number) => `$${value.toLocaleString("es-MX")} MXN`;
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const buildAddressLine = (customer: CheckoutData) => [
  customer.street,
  customer.exteriorNumber ? `No. ext. ${customer.exteriorNumber}` : "",
  customer.interiorNumber ? `No. int. ${customer.interiorNumber}` : "",
  customer.neighborhood ? `Col. ${customer.neighborhood}` : "",
  customer.reference ? `Ref. ${customer.reference}` : "",
].filter(Boolean).join(", ");

function getShipping(subtotal: number, personalDelivery: boolean) {
  if (subtotal <= 0 || subtotal >= FREE_SHIPPING_MINIMUM) return 0;
  if (personalDelivery) return 0;
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
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [clipReturnState, setClipReturnState] = useState<"idle" | "checking" | "pending" | "error">("idle");
  const [successOrder, setSuccessOrder] = useState<SuccessOrder | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountMxn, setDiscountMxn] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

  const cleanPostalCode = data.postalCode.replace(/\D/g, "");
  const personalDeliveryAvailable = isFreePersonalDeliveryPostalCode(cleanPostalCode);
  const personalDelivery = personalDeliveryAvailable && deliveryMethod === "personal";
  const discountedSubtotal = Math.max(0, cart.subtotal - discountMxn);
  const shipping = getShipping(discountedSubtotal, personalDelivery);
  const total = discountedSubtotal + shipping;
  const shippingLabel = personalDelivery
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
    try {
      const saved = localStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved) as { data?: CheckoutData; step?: Step; couponCode?: string; deliveryMethod?: DeliveryMethod };
        if (draft.data) setData({ ...emptyData, ...draft.data });
        if (draft.step) setStep(draft.step);
        if (draft.couponCode) setCouponCode(draft.couponCode);
        if (draft.deliveryMethod === "personal" || draft.deliveryMethod === "national") setDeliveryMethod(draft.deliveryMethod);
      }
    } catch {
      localStorage.removeItem(CHECKOUT_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ data, step, couponCode, deliveryMethod }));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [data, step, couponCode, deliveryMethod]);

  useEffect(() => {
    if (!isValidEmail(data.email) || !cart.items.length) return;
    const timeout = window.setTimeout(() => {
      void fetch("/api/checkout/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, fullName: data.fullName, items: cart.items, subtotalMxn: cart.subtotal }),
      });
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [cart.items, cart.subtotal, data.email, data.fullName]);

  useEffect(() => {
    if (!/^\d{5}$/.test(cleanPostalCode)) return;
    let cancelled = false;
    setZipLoading(true);
    fetch(`/api/postal-code/${cleanPostalCode}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result: unknown) => {
        if (cancelled || typeof result !== "object" || !result) return;
        const parsed = result as Record<string, unknown>;
        const state = parsed.state;
        const city = parsed.city;
        if (state || city) setData((current) => ({ ...current, state: String(state || current.state), city: String(city || current.city) }));
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setZipLoading(false); });
    return () => { cancelled = true; };
  }, [cleanPostalCode]);

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
        localStorage.removeItem(CHECKOUT_DRAFT_KEY);
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
    const nextValue = field === "postalCode"
      ? value.replace(/\D/g, "").slice(0, 5)
      : field === "whatsapp"
        ? value.replace(/[^\d+ ()-]/g, "").slice(0, 18)
        : field === "exteriorNumber" || field === "interiorNumber"
          ? value.replace(/[^\dA-Za-z -]/g, "").slice(0, 5)
          : value;
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
    if (data.whatsapp.replace(/\D/g, "").length < 10) nextErrors.whatsapp = "Ingresa un teléfono de al menos 10 dígitos.";
    if (!data.country.trim()) nextErrors.country = "País obligatorio.";
    if (data.street.trim().length < 3) nextErrors.street = "Calle obligatoria.";
    if (!data.exteriorNumber.trim()) nextErrors.exteriorNumber = "Número exterior obligatorio.";
    if (!data.neighborhood.trim()) nextErrors.neighborhood = "Colonia obligatoria.";
    if (!data.city.trim()) nextErrors.city = "Ciudad obligatoria.";
    if (!data.state.trim()) nextErrors.state = "Estado obligatorio.";
    if (!/^\d{5}$/.test(cleanPostalCode)) nextErrors.postalCode = "CP de 5 dígitos.";
    if (data.reference.trim().length < 4) nextErrors.reference = "Agrega una referencia de entrega.";
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

  async function applyCoupon() {
    if (!isValidEmail(data.email)) {
      setCouponMessage("Primero agrega un correo válido.");
      return;
    }
    setCouponLoading(true);
    setCouponMessage("");
    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotalMxn: cart.subtotal, email: data.email }),
    });
    const result = await response.json() as { discountMxn?: number; code?: string; label?: string; error?: string };
    setCouponLoading(false);
    if (!response.ok) {
      setDiscountMxn(0);
      setCouponMessage(result.error || "Cupón inválido.");
      return;
    }
    setCouponCode(result.code || couponCode.toUpperCase());
    setDiscountMxn(Number(result.discountMxn || 0));
    setCouponMessage(`${result.label}. Cupón aplicado.`);
  }

  async function startClipCheckout() {
    setIsSubmitting(true);
    setPaymentError("");
    const checkoutCustomer = { ...data, address: buildAddressLine(data) };
    try {
      const response = await fetch("/api/clip/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: checkoutCustomer,
          items: cart.items.map(({ slug, size, quantity }) => ({ slug, size, quantity })),
          couponCode: discountMxn > 0 ? couponCode : "",
          deliveryMethod: personalDelivery ? "personal" : "national",
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

    setIsSubmitting(true);
    setPaymentError("");
    const checkoutCustomer = { ...data, address: buildAddressLine(data) };
    try {
      const response = await fetch("/api/checkout/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: checkoutCustomer,
          items: cart.items.map(({ slug, size, quantity }) => ({ slug, size, quantity })),
          couponCode: discountMxn > 0 ? couponCode : "",
          deliveryMethod: personalDelivery ? "personal" : "national",
        }),
      });
      const result = await response.json() as { orderCode?: string; totalMxn?: number; shippingMxn?: number; error?: string };
      if (!response.ok || !result.orderCode) throw new Error(result.error || "No pudimos registrar tu transferencia.");
      const finalTotal = Number(result.totalMxn ?? total);
      const message = `Hola, quiero confirmar mi compra ${result.orderCode}. Cliente: ${data.fullName}. Prendas: ${itemSummary}. Total: ${money(finalTotal)}. Adjunto mi comprobante.`;
      setSuccessOrder({
        code: result.orderCode,
        total: finalTotal,
        shipping: Number(result.shippingMxn ?? shipping),
        items: [...cart.items],
        customer: data,
        paymentMethod: "transfer",
        whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      });
      localStorage.removeItem(CHECKOUT_DRAFT_KEY);
      cart.clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "No pudimos registrar la orden.");
    } finally {
      setIsSubmitting(false);
    }
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
            : <>Tu compra quedó registrada. Transfiere el monto exacto y envía el comprobante para activar el seguimiento.</>}
        </p>
        <div className="success-order-card">
          <div><span>MONTO FINAL</span><strong>{money(successOrder.total)}</strong></div>
          <div><span>MÉTODO</span><strong>{paidWithClip ? "Tarjeta / Clip" : "Transferencia"}</strong></div>
          <div><span>ESTADO</span><strong>{paidWithClip ? "Pagado" : "Por confirmar"}</strong></div>
          <div><span>{paidWithClip ? "RECIBO" : "BANCO"}</span><strong>{paidWithClip ? successOrder.receiptNo || "Confirmado por Clip" : PAYMENT_DETAILS.bank}</strong></div>
        </div>
        <div className="success-customer-card">
          <div><span>CONTACTO</span><strong>{successOrder.customer.fullName}</strong><p>{successOrder.customer.email} / {successOrder.customer.whatsapp}</p></div>
          <div><span>ENTREGA</span><strong>{successOrder.customer.neighborhood}, {successOrder.customer.city}</strong><p>{buildAddressLine(successOrder.customer)}</p></div>
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
                    <label><span>NOMBRE DEL CONTACTO *</span><input required aria-required="true" value={data.fullName} onChange={(event) => updateField("fullName", event.target.value)} autoComplete="name" maxLength={30} />{errors.fullName && <small>{errors.fullName}</small>}</label>
                    <label><span>COMPAÑÍA (OPCIONAL)</span><input value={data.company} onChange={(event) => updateField("company", event.target.value)} autoComplete="organization" maxLength={50} /></label>
                    <label><span>TELÉFONO *</span><input required aria-required="true" value={data.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} type="tel" inputMode="tel" autoComplete="tel" maxLength={18} />{errors.whatsapp && <small>{errors.whatsapp}</small>}</label>
                    <label><span>PAÍS *</span><select required aria-required="true" value={data.country} onChange={(event) => updateField("country", event.target.value)} autoComplete="country-name"><option value="México">México</option></select>{errors.country && <small>{errors.country}</small>}</label>
                    <label className="wide"><span>CALLE *</span><input required aria-required="true" value={data.street} onChange={(event) => updateField("street", event.target.value)} autoComplete="address-line1" maxLength={42} />{errors.street && <small>{errors.street}</small>}</label>
                    <label><span>NO. EXTERIOR *</span><input required aria-required="true" value={data.exteriorNumber} onChange={(event) => updateField("exteriorNumber", event.target.value)} autoComplete="address-line2" maxLength={5} />{errors.exteriorNumber && <small>{errors.exteriorNumber}</small>}</label>
                    <label><span>NO. INTERIOR (OPCIONAL)</span><input value={data.interiorNumber} onChange={(event) => updateField("interiorNumber", event.target.value)} autoComplete="address-line3" maxLength={5} /></label>
                    <label><span>CÓDIGO POSTAL * {zipLoading && "· BUSCANDO..."}</span><input required aria-required="true" value={data.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} inputMode="numeric" pattern="\d{5}" minLength={5} maxLength={5} />{errors.postalCode && <small>{errors.postalCode}</small>}</label>
                    <label><span>COLONIA *</span><input required aria-required="true" value={data.neighborhood} onChange={(event) => updateField("neighborhood", event.target.value)} autoComplete="address-level3" />{errors.neighborhood && <small>{errors.neighborhood}</small>}</label>
                    <label><span>CIUDAD *</span><input required aria-required="true" value={data.city} onChange={(event) => updateField("city", event.target.value)} autoComplete="address-level2" />{errors.city && <small>{errors.city}</small>}</label>
                    <label><span>ESTADO *</span><input required aria-required="true" value={data.state} onChange={(event) => updateField("state", event.target.value)} autoComplete="address-level1" />{errors.state && <small>{errors.state}</small>}</label>
                    <label className="wide"><span>REFERENCIA *</span><input required aria-required="true" value={data.reference} onChange={(event) => updateField("reference", event.target.value)} placeholder="Entre calles, color de fachada o punto cercano" maxLength={25} />{errors.reference && <small>{errors.reference}</small>}</label>
                  </div>
                  {cleanPostalCode.length === 5 && personalDeliveryAvailable && (
                    <fieldset className="delivery-methods">
                      <legend>ELIGE CÓMO QUIERES RECIBIR TU PEDIDO</legend>
                      <div role="radiogroup" aria-label="Método de entrega">
                        <button className={deliveryMethod === "personal" ? "active" : ""} type="button" role="radio" aria-checked={deliveryMethod === "personal"} onClick={() => setDeliveryMethod("personal")}>
                          <MapPin size={21} />
                          <span><b>QUIERO ENTREGA PERSONAL</b><small>Gratis · acordamos punto y horario</small></span>
                          {deliveryMethod === "personal" && <Check size={17} />}
                        </button>
                        <button className={deliveryMethod === "national" ? "active" : ""} type="button" role="radio" aria-checked={deliveryMethod === "national"} onClick={() => setDeliveryMethod("national")}>
                          <Truck size={21} />
                          <span><b>QUIERO ENVÍO A MI CASA</b><small>{discountedSubtotal >= FREE_SHIPPING_MINIMUM ? "Gratis por el monto de tu compra" : `${money(SHIPPING_COST)} · entrega a domicilio`}</small></span>
                          {deliveryMethod === "national" && <Check size={17} />}
                        </button>
                      </div>
                      <p>{deliveryMethod === "personal" ? LOCAL_DELIVERY_COPY : "Enviaremos tu pedido a la dirección que registraste."}</p>
                    </fieldset>
                  )}
                  {cleanPostalCode.length === 5 && !personalDeliveryAvailable && (
                    <div className="delivery-result national">
                      <Truck size={20} />
                      <div>
                        <b>{shipping === 0 ? "ENVÍO NACIONAL GRATIS" : `ENVÍO A DOMICILIO (${money(SHIPPING_COST)})`}</b>
                        <p>{shipping === 0 ? "Tu compra supera el mínimo de envío gratis." : "La entrega personal no está disponible en este código postal."}</p>
                      </div>
                    </div>
                  )}
                  <div className="checkout-controls">
                    <button className="checkout-back secondary-control" type="button" onClick={() => goToStep(1)}>VOLVER</button>
                    <button className="checkout-next" type="button" onClick={continueToPayment}>CONTINUAR AL PAGO <span>↗</span></button>
                  </div>
                  <p className="checkout-estimate"><Truck size={15} /> Producción estimada: 5–8 días hábiles. Envío nacional: 2–5 días hábiles adicionales.</p>
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
                  {paymentError && <p className="payment-error" role="alert">{paymentError}</p>}

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
                      <button className="whatsapp-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "REGISTRANDO ORDEN..." : <>APARTAR Y ENVIAR COMPROBANTE <span>↗</span></>}</button>
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
            <div className="checkout-coupon">
              <label htmlFor="coupon-code">CUPÓN O CÓDIGO DE PAQUETE</label>
              <div><input id="coupon-code" value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setDiscountMxn(0); setCouponMessage(""); }} placeholder="OVRLMT..." /><button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode}>{couponLoading ? "..." : "APLICAR"}</button></div>
              {couponMessage && <small className={discountMxn > 0 ? "success" : "error"}>{couponMessage}</small>}
            </div>
            <dl>
              <div><dt>Subtotal</dt><dd>{money(cart.subtotal)}</dd></div>
              {discountMxn > 0 && <div><dt>Descuento</dt><dd>-{money(discountMxn)}</dd></div>}
              <div><dt>{shippingLabel}</dt><dd>{shipping === 0 ? "GRATIS" : money(shipping)}</dd></div>
              <div><dt>Total a pagar</dt><dd>{money(total)}</dd></div>
            </dl>
            <div className="sidebar-trust-note"><ShieldCheck size={17} /><span>Pago protegido por Clip. Los datos de tu tarjeta no pasan por OVRLMT.</span></div>
            {discountedSubtotal < FREE_SHIPPING_MINIMUM && !personalDelivery && <div className="shipping-progress"><div><i style={{ width: `${Math.min(100, discountedSubtotal / FREE_SHIPPING_MINIMUM * 100)}%` }} /></div><p>Te faltan {money(FREE_SHIPPING_MINIMUM - discountedSubtotal)} para envío gratis.</p></div>}
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
