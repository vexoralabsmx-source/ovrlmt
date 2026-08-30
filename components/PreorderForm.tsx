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
    if (String(form.get("customerWhatsapp") || "").replace(/\D/g, "").length < 10) {
      setError("Agrega un teléfono válido de al menos 10 dígitos.");
      setSubmitting(false);
      return;
    }
    const requiredDeliveryFields = [
      ["addressStreet", "calle"],
      ["addressExteriorNumber", "número exterior"],
      ["postalCode", "código postal"],
      ["addressNeighborhood", "colonia"],
      ["addressCity", "ciudad"],
      ["addressState", "estado"],
      ["addressReference", "referencia"],
    ];
    const missingDelivery = requiredDeliveryFields.find(([field]) => !String(form.get(field) || "").trim());
    if (missingDelivery) {
      setError(`Agrega tu ${missingDelivery[1]}.`);
      setSubmitting(false);
      return;
    }
    if (!/^\d{5}$/.test(String(form.get("postalCode") || "").replace(/\D/g, ""))) {
      setError("Agrega un código postal de 5 dígitos.");
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
      customerCompany: form.get("customerCompany"),
      productSlug,
      productName: `${selectedProduct.name} ${selectedProduct.piece}`,
      size,
      quantity,
      unitPriceMxn: PRODUCT_PRICE,
      discountCode: form.get("discountCode"),
      addressCountry: "México",
      addressStreet: form.get("addressStreet"),
      addressExteriorNumber: form.get("addressExteriorNumber"),
      addressInteriorNumber: form.get("addressInteriorNumber"),
      addressNeighborhood: form.get("addressNeighborhood"),
      addressState: form.get("addressState"),
      addressCity: form.get("addressCity"),
      postalCode: form.get("postalCode"),
      addressReference: form.get("addressReference"),
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
      <span>PEDIDO RECIBIDO</span>
      <h2>{result.orderCode}</h2>
      <p>Total: ${result.totalMxn.toLocaleString("es-MX")} MXN</p>
      <p className="preorder-success-email">{result.emailWarning ? "Intentamos enviar confirmación a" : "Confirmación enviada a"} {result.customerEmail}</p>
      {result.emailWarning ? <p className="preorder-error">Tu pedido fue registrado, pero no pudimos enviar el correo de confirmación. Escríbenos por WhatsApp con tu código de pedido.</p> : null}
      <a className="submit-btn" href={whatsappUrl} target="_blank" rel="noreferrer"><span>CONFIRMAR POR WHATSAPP</span><span>↗</span></a>
      <small>Tu pedido queda confirmado y entra a producción cuando validemos tu comprobante.</small>
    </div>;
  }

  return <form className="preorder-form" onSubmit={submit}>
    <label><span>01 / NOMBRE DEL CONTACTO *</span><input name="customerName" required autoComplete="name" placeholder="TU NOMBRE" maxLength={30} /></label>
    <label><span>02 / COMPAÑÍA (OPCIONAL)</span><input name="customerCompany" autoComplete="organization" maxLength={50} /></label>
    <label><span>03 / WHATSAPP *</span><input name="customerWhatsapp" required inputMode="tel" autoComplete="tel" placeholder="+52" /></label>
    <label><span>04 / CORREO ELECTRÓNICO *</span><input name="customerEmail" required type="email" autoComplete="email" placeholder="TU CORREO" /><small>Lo usaremos para enviarte la confirmación y seguimiento de tu pedido.</small></label>
    <label><span>05 / PRODUCTO</span><select name="productSlug" value={productSlug} onChange={(event) => setProductSlug(event.target.value)}>{products.map((product) => <option value={product.slug} key={product.slug}>{product.name} {product.piece} / {product.price}</option>)}</select></label>
    <label><span>06 / TALLA</span><select name="size" value={size} onChange={(event) => setSize(event.target.value)}>{SIZES.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label><span>07 / CANTIDAD</span><input name="quantity" type="number" min="1" max="20" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} required /></label>
    <label><span>08 / CUPÓN</span><input name="discountCode" placeholder="OVRLMT-10FFDP1" /></label>
    <label><span>09 / PAÍS *</span><select name="addressCountry" defaultValue="México" required><option value="México">México</option></select></label>
    <label><span>10 / CALLE *</span><input name="addressStreet" required autoComplete="address-line1" maxLength={42} /></label>
    <label><span>11 / NO. EXTERIOR *</span><input name="addressExteriorNumber" required maxLength={5} /></label>
    <label><span>12 / NO. INTERIOR (OPCIONAL)</span><input name="addressInteriorNumber" maxLength={5} /></label>
    <label><span>13 / CÓDIGO POSTAL *</span><input name="postalCode" required inputMode="numeric" pattern="\d{5}" minLength={5} maxLength={5} /></label>
    <label><span>14 / COLONIA *</span><input name="addressNeighborhood" required autoComplete="address-level3" /></label>
    <label><span>15 / CIUDAD *</span><input name="addressCity" required autoComplete="address-level2" placeholder="CIUDAD" /></label>
    <label><span>16 / ESTADO *</span><input name="addressState" required autoComplete="address-level1" placeholder="ESTADO" /></label>
    <label className="full"><span>17 / REFERENCIA *</span><input name="addressReference" required maxLength={25} placeholder="ENTRE CALLES O PUNTO CERCANO" /></label>
    <fieldset className="preorder-shipping"><legend>19 / TIPO DE ENVÍO</legend><label><input type="radio" name="shippingType" value="external" defaultChecked /> ENVÍO EXTERNO</label><label><input type="radio" name="shippingType" value="local" /> ENTREGA LOCAL</label></fieldset>
    <label className="full"><span>18 / NOTAS OPCIONALES</span><textarea name="notes" rows={3} placeholder="DETALLES ADICIONALES" /></label>
    {error ? <p className="preorder-error">{error}</p> : null}
    <button className="submit-btn" type="submit" disabled={isSubmitting}><span>{isSubmitting ? "REGISTRANDO..." : "APARTAR PLAYERA"}</span><span>↗</span></button>
    <p className="preorder-confirmation"><strong>Todo es sobre pedido.</strong> La producción inicia al confirmar el pago. Envío externo: $150 MXN; gratis desde $1,500 MXN después de descuento.</p>
  </form>;
}
