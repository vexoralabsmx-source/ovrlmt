"use client";

import { type FormEvent, useMemo, useState } from "react";
import { products } from "@/data/products";
import { PRODUCT_PRICE, SIZES } from "@/data/store";
import { generateWhatsappUrl } from "@/src/lib/whatsapp";

type ApiSuccess = {
  ok: true;
  orderCode: string;
  totalMxn: number;
  customerEmail: string;
  whatsappMessage: string;
  emailWarning?: boolean;
  emailSent?: boolean;
  adminEmailSent?: boolean;
};

type ApiError = {
  ok: false;
  code: string;
  message: string;
};

export function PreorderForm({ initialProduct }: { initialProduct?: string }) {
  const initialSlug = products.find((product) => product.slug === initialProduct)?.slug || products[0].slug;
  const [productSlug, setProductSlug] = useState(initialSlug);
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiSuccess | null>(null);
  const [submittedName, setSubmittedName] = useState("");
  const selectedProduct = useMemo(() => products.find((product) => product.slug === productSlug) || products[0], [productSlug]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const customerEmail = String(form.get("customerEmail") || "").trim().toLowerCase();

    if (!customerEmail) {
      setError("Agrega tu correo para recibir la confirmación de tu pedido.");
      setSubmitting(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      setError("Escribe un correo electrónico válido.");
      setSubmitting(false);
      return;
    }
    if (!form.get("customerWhatsapp")) {
      setError("Agrega tu WhatsApp para poder dar seguimiento.");
      setSubmitting(false);
      return;
    }
    if (!size) {
      setError("Selecciona una talla.");
      setSubmitting(false);
      return;
    }

    const payload = {
      customerName: form.get("customerName"),
      customerEmail: form.get("customerEmail"),
      customerWhatsapp: form.get("customerWhatsapp"),
      productSlug,
      productName: `${selectedProduct.name} ${selectedProduct.piece}`,
      size,
      quantity,
      unitPriceMxn: PRODUCT_PRICE,
      discountCode: form.get("discountCode"),
      addressState: form.get("addressState"),
      addressCity: form.get("addressCity"),
      shippingType: form.get("shippingType"),
      notes: form.get("notes"),
    };

    try {
      const response = await fetch("/api/preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as ApiSuccess | ApiError;
      if (!response.ok || !data.ok) throw new Error(data.ok ? "No pudimos registrar tu pedido. Intenta de nuevo o escríbenos por WhatsApp." : data.message);

      setSubmittedName(String(payload.customerName || ""));
      setResult(data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No pudimos registrar tu pedido, intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const whatsappUrl = generateWhatsappUrl({
      orderCode: result.orderCode,
      productName: `${selectedProduct.name} ${selectedProduct.piece}`,
      size,
      quantity,
      totalMxn: result.totalMxn,
      customerName: submittedName,
      customerEmail: result.customerEmail,
    });

    return <div className="preorder-success">
      <span>PREORDER RECIBIDO</span>
      <h2>{result.orderCode}</h2>
      <p>Total: ${result.totalMxn.toLocaleString("es-MX")} MXN</p>
      <p className="preorder-success-email">{result.emailWarning ? "Intentamos enviar confirmación a" : "Confirmación enviada a"} {result.customerEmail}</p>
      {result.emailWarning ? <p className="preorder-error">Tu pedido fue registrado, pero no pudimos enviar el correo de confirmación. Escríbenos por WhatsApp con tu código de pedido.</p> : null}
      <a className="submit-btn" href={whatsappUrl} target="_blank" rel="noreferrer"><span>CONFIRMAR POR WHATSAPP</span><span>↗</span></a>
      <small>Tu pedido queda confirmado y entra a producción cuando validemos tu comprobante.</small>
    </div>;
  }

  return <form className="preorder-form" onSubmit={submit}>
    <label className="full"><span>01 / NOMBRE COMPLETO</span><input name="customerName" required autoComplete="name" placeholder="TU NOMBRE" /></label>
    <label><span>02 / WHATSAPP</span><input name="customerWhatsapp" required inputMode="tel" autoComplete="tel" placeholder="+52" /></label>
    <label><span>03 / CORREO ELECTRÓNICO *</span><input name="customerEmail" required type="email" autoComplete="email" placeholder="TU CORREO" /><small>Lo usaremos para enviarte la confirmación y seguimiento de tu pedido.</small></label>
    <label><span>04 / PRODUCTO</span><select name="productSlug" value={productSlug} onChange={(event) => setProductSlug(event.target.value)}>{products.map((product) => <option value={product.slug} key={product.slug}>{product.name} {product.piece} / {product.price}</option>)}</select></label>
    <label><span>05 / TALLA</span><select name="size" value={size} onChange={(event) => setSize(event.target.value)}>{SIZES.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label><span>06 / CANTIDAD</span><input name="quantity" type="number" min="1" max="20" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} required /></label>
    <label><span>07 / CUPÓN</span><input name="discountCode" placeholder="OVRLMT-10FFDP1" /></label>
    <label><span>08 / CIUDAD</span><input name="addressCity" required autoComplete="address-level2" placeholder="CIUDAD" /></label>
    <label><span>09 / ESTADO</span><input name="addressState" required autoComplete="address-level1" placeholder="ESTADO" /></label>
    <fieldset className="preorder-shipping"><legend>10 / TIPO DE ENVÍO</legend><label><input type="radio" name="shippingType" value="external" defaultChecked /> ENVÍO EXTERNO</label><label><input type="radio" name="shippingType" value="local" /> ENTREGA LOCAL</label></fieldset>
    <label className="full"><span>11 / NOTAS OPCIONALES</span><textarea name="notes" rows={3} placeholder="DETALLES ADICIONALES" /></label>
    {error ? <p className="preorder-error">{error}</p> : null}
    <button className="submit-btn" type="submit" disabled={isSubmitting}><span>{isSubmitting ? "REGISTRANDO..." : "APARTAR PLAYERA"}</span><span>↗</span></button>
    <p className="preorder-confirmation"><strong>Todo es sobre pedido.</strong> La producción inicia al confirmar el pago. Envío externo: $150 MXN; gratis desde $1,500 MXN después de descuento.</p>
  </form>;
}
