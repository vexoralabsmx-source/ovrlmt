"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Copy, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/CartProvider";
import { ACCOUNT_NAME, BANK_CARD, BANK_NAME, FREE_SHIPPING_MINIMUM, PRODUCT_PRICE, WHATSAPP_NUMBER } from "@/data/store";

const money = (value: number) => `$${value.toLocaleString("es-MX")} MXN`;

export function CartDrawer() {
  const cart = useCart();
  const [copied, setCopied] = useState(false);

  async function copyPayment() {
    await navigator.clipboard.writeText(`${BANK_NAME}\n${ACCOUNT_NAME}\n${BANK_CARD}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const products = cart.items.map((item) => `${item.name} — Talla ${item.size} — ${item.quantity} pieza${item.quantity > 1 ? "s" : ""}`).join("\n");
    const address = `${data.get("address")}, ${data.get("city")}, ${data.get("state")}, C.P. ${data.get("postal")}`;
    const shipping = cart.shipping === 0 ? "Envío gratis" : money(cart.shipping);
    const message = `Hola, quiero confirmar mi preorden de OVRLMT.\n\nNombre:\n${data.get("name")}\n\nPedido:\n${products}\n\nSubtotal:\n${money(cart.subtotal)}\n\nEnvío:\n${shipping}\n\nTotal:\n${money(cart.total)}\n\nDirección:\n${address}\n\nYa realicé el pago y adjunto mi comprobante.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  const shippingMessage = cart.subtotal >= FREE_SHIPPING_MINIMUM
    ? "Tu pedido aplica para envío gratis."
    : `Te faltan ${money(FREE_SHIPPING_MINIMUM - cart.subtotal)} para envío gratis.`;

  return <>
    <AnimatePresence>
      {cart.isOpen && <motion.div className="cart-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <button className="cart-backdrop" onClick={cart.closeCart} aria-label="Cerrar carrito" />
        <motion.aside className="cart-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: .48, ease: [0.77, 0, .18, 1] }} aria-label="Carrito de preorden">
          <div className="cart-head"><div><span>ORDER SYSTEM / 001</span><h2>TU CARRITO <b>{String(cart.itemCount).padStart(2, "0")}</b></h2></div><button onClick={cart.closeCart} aria-label="Cerrar"><X /></button></div>
          <div className="cart-body">
            {cart.items.length === 0 ? <div className="cart-empty"><ShoppingBag size={38} /><p>TU CARRITO ESTÁ VACÍO</p><span>Agrega una pieza del DROP 001 para comenzar.</span></div> : cart.items.map((item) => <article className="cart-item" key={`${item.slug}-${item.size}`}>
              <div className="cart-thumb"><Image src={item.image} alt={item.name} fill sizes="90px" /></div>
              <div className="cart-item-copy"><div><h3>{item.name}</h3><p>TALLA {item.size} / {money(PRODUCT_PRICE)} C/U</p></div>
                <div className="cart-item-bottom"><div className="qty-control"><button type="button" onClick={() => cart.updateQuantity(item.slug, item.size, item.quantity - 1)} aria-label="Restar"><Minus size={12} /></button><span>{item.quantity}</span><button type="button" onClick={() => cart.updateQuantity(item.slug, item.size, item.quantity + 1)} aria-label="Sumar"><Plus size={12} /></button></div><strong>{money(item.quantity * PRODUCT_PRICE)}</strong></div>
              </div><button className="remove-item" onClick={() => cart.removeItem(item.slug, item.size)} aria-label={`Eliminar ${item.name}`}><Trash2 size={15} /></button>
            </article>)}
          </div>
          {cart.items.length > 0 && <div className="cart-summary"><p className={cart.subtotal >= FREE_SHIPPING_MINIMUM ? "shipping-ok" : ""}>{shippingMessage}</p><dl><div><dt>SUBTOTAL</dt><dd>{money(cart.subtotal)}</dd></div><div><dt>ENVÍO</dt><dd>{cart.shipping === 0 ? "GRATIS" : money(cart.shipping)}</dd></div><div className="cart-total"><dt>TOTAL</dt><dd>{money(cart.total)}</dd></div></dl><button className="checkout-trigger" onClick={cart.openCheckout}>FINALIZAR PREORDEN <span>↗</span></button><small>Pago seguro por transferencia / Confirmación vía WhatsApp</small></div>}
        </motion.aside>
      </motion.div>}
    </AnimatePresence>

    <AnimatePresence>
      {cart.checkoutOpen && <motion.div className="checkout-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.section className="checkout-shell" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: .45 }}>
          <header className="checkout-head"><button onClick={() => { cart.closeCheckout(); cart.openCart(); }}><ChevronLeft size={17} /> VOLVER AL CARRITO</button><span>SECURE PREORDER / AD-001</span><button onClick={cart.closeCheckout} aria-label="Cerrar checkout"><X /></button></header>
          <form className="checkout-grid" onSubmit={submitOrder}>
            <div className="checkout-fields"><p className="checkout-step">01 / DATOS DE ENVÍO</p><h2>CONFIRMA TU<br />PREORDEN.</h2>
              <div className="field-grid">
                <label className="wide"><span>NOMBRE COMPLETO *</span><input name="name" required autoComplete="name" placeholder="TU NOMBRE" /></label>
                <label><span>WHATSAPP *</span><input name="whatsapp" required type="tel" autoComplete="tel" placeholder="+52" /></label>
                <label><span>CIUDAD *</span><input name="city" required autoComplete="address-level2" placeholder="CIUDAD" /></label>
                <label><span>ESTADO *</span><input name="state" required autoComplete="address-level1" placeholder="ESTADO" /></label>
                <label><span>CÓDIGO POSTAL *</span><input name="postal" required inputMode="numeric" autoComplete="postal-code" placeholder="00000" /></label>
                <label className="wide"><span>DIRECCIÓN COMPLETA *</span><textarea name="address" required autoComplete="street-address" rows={2} placeholder="CALLE, NÚMERO, COLONIA Y REFERENCIAS" /></label>
                <label className="wide"><span>NOTAS DEL PEDIDO</span><textarea name="notes" rows={2} placeholder="INDICACIONES ADICIONALES (OPCIONAL)" /></label>
              </div>
            </div>
            <aside className="payment-column">
              <div className="order-review"><p className="checkout-step">02 / RESUMEN</p>{cart.items.map((item) => <div className="review-item" key={`${item.slug}-${item.size}`}><span>{item.quantity}× {item.name}<small>TALLA {item.size}</small></span><b>{money(item.quantity * PRODUCT_PRICE)}</b></div>)}<dl><div><dt>SUBTOTAL</dt><dd>{money(cart.subtotal)}</dd></div><div><dt>ENVÍO</dt><dd>{cart.shipping === 0 ? "ENVÍO GRATIS" : money(cart.shipping)}</dd></div><div><dt>TOTAL FINAL</dt><dd>{money(cart.total)}</dd></div></dl></div>
              <div className="bank-card"><div className="bank-top"><p className="checkout-step">03 / PAGO</p><span>TRANSFER ONLY</span></div><h3>Pago por transferencia</h3><p>Realiza tu pago por transferencia y envía tu comprobante por WhatsApp con tu nombre completo para confirmar tu preorden.</p><dl><div><dt>BANCO</dt><dd>{BANK_NAME}</dd></div><div><dt>NOMBRE</dt><dd>{ACCOUNT_NAME}</dd></div><div><dt>TARJETA</dt><dd>{BANK_CARD}</dd></div></dl><button type="button" className="copy-bank" onClick={copyPayment}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "DATOS COPIADOS" : "COPIAR DATOS DE PAGO"}</button><small>Tu preorden queda apartada únicamente después de enviar tu comprobante de pago.</small></div>
              <label className="terms-check"><input type="checkbox" required /><span>Entiendo que mi preorden se confirma únicamente después de enviar mi comprobante de pago por WhatsApp.</span></label>
              <button className="whatsapp-submit" type="submit">ENVIAR COMPROBANTE POR WHATSAPP <span>↗</span></button>
            </aside>
          </form>
        </motion.section>
      </motion.div>}
    </AnimatePresence>
  </>;
}
