"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Flag, Minus, Plane, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { FREE_SHIPPING_MINIMUM, LOCAL_DELIVERY_COPY, PRODUCT_PRICE } from "@/data/store";

const money = (value: number) => `$${value.toLocaleString("es-MX")} MXN`;

export function CartDrawer() {
  const cart = useCart();
  const drawer = useRef<HTMLElement>(null);
  const closeRef = useRef(cart.closeCart);
  closeRef.current = cart.closeCart;
  useEffect(() => {
    if (!cart.isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = drawer.current;
    const controls = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select') || []);
    controls()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const items = controls(); const first = items[0]; const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [cart.isOpen]);
  const shippingMessage = cart.subtotal - cart.wholesaleDiscount >= FREE_SHIPPING_MINIMUM
    ? "Tu pedido aplica para envío gratis."
    : `Te faltan ${money(FREE_SHIPPING_MINIMUM - (cart.subtotal - cart.wholesaleDiscount))} para envío gratis.`;

  return <AnimatePresence>{cart.isOpen && <motion.div className="cart-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <button className="cart-backdrop" onClick={cart.closeCart} aria-label="Cerrar carrito" />
    <motion.aside ref={drawer} role="dialog" aria-modal="true" className="cart-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: .38, ease: [0.77, 0, .18, 1] }} aria-label="Carrito">
      <div className="cart-head"><div><span>ORDER SYSTEM</span><h2>TU CARRITO <b>{String(cart.itemCount).padStart(2, "0")}</b></h2></div><button onClick={cart.closeCart} aria-label="Cerrar"><X /></button></div>
      <div className="cart-body">
        {cart.items.length === 0 ? <div className="cart-empty"><ShoppingBag size={38} /><p>TU CARRITO ESTÁ VACÍO</p><span>Agrega una pieza de nuestros Drops activos para comenzar.</span></div> : cart.items.map((item) => <article className="cart-item" key={`${item.slug}-${item.size}`}>
          <div className="cart-thumb"><Image src={item.image} alt={item.name} fill sizes="90px" /></div>
          <div className="cart-item-copy"><div><h3>{item.name}</h3><p>TALLA {item.size} / {money(item.priceMxn || PRODUCT_PRICE)} C/U</p></div>
            <div className="cart-item-bottom"><div className="qty-control"><button type="button" onClick={() => cart.updateQuantity(item.slug, item.size, item.quantity - 1)} aria-label="Restar"><Minus size={12} /></button><span>{item.quantity}</span><button type="button" onClick={() => cart.updateQuantity(item.slug, item.size, item.quantity + 1)} aria-label="Sumar"><Plus size={12} /></button></div><strong>{money(item.quantity * (item.priceMxn || PRODUCT_PRICE))}</strong></div>
          </div><button className="remove-item" onClick={() => cart.removeItem(item.slug, item.size)} aria-label={`Eliminar ${item.name}`}><Trash2 size={15} /></button>
        </article>)}
      </div>
      {cart.items.length > 0 && <div className="cart-summary"><p className="made-to-order-note"><strong>SOBRE PEDIDO</strong><span>La producción inicia después de confirmar tu pago.</span></p><p className={cart.subtotal - cart.wholesaleDiscount >= FREE_SHIPPING_MINIMUM ? "shipping-ok" : ""}>{shippingMessage}</p><div className="shipping-icons"><span><Flag size={13} /> MÉXICO</span><span><Plane size={13} /> NACIONAL</span><span><Truck size={13} /> LOCAL</span></div><p className="local-delivery-mini">{LOCAL_DELIVERY_COPY}</p><dl><div><dt>SUBTOTAL</dt><dd>{money(cart.subtotal)}</dd></div>{cart.wholesaleDiscount > 0 && <div><dt>MAYOREO</dt><dd>-{money(cart.wholesaleDiscount)}</dd></div>}<div><dt>ENVÍO</dt><dd>{cart.shipping === 0 ? "GRATIS" : money(cart.shipping)}</dd></div><div className="cart-total"><dt>TOTAL</dt><dd>{money(cart.total)}</dd></div></dl><Link className="checkout-trigger" href="/cart" onClick={cart.closeCart}>REVISAR Y FINALIZAR <span>↗</span></Link><button className="clear-cart" type="button" onClick={cart.clearCart}>VACIAR CARRITO</button></div>}
    </motion.aside>
  </motion.div>}</AnimatePresence>;
}
