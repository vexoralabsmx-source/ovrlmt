"use client";
import { MAX_ITEM_QUANTITY } from "@/data/wholesale";


import { availabilityLabel as fomo, DELIVERY_ESTIMATE, SHIPPING_COPY } from "@/data/commerce";

import { Modal } from "./Modal";
import { SizeGuideContent } from "./SizeGuideContent";
import { useState } from "react";
import type { Product } from "@/data/products";
import { SIZES, WHATSAPP_NUMBER, type ProductSize } from "@/data/store";
import { useCart } from "@/components/CartProvider";
import { Minus, Plus, Ruler } from "lucide-react";

export function ProductPurchase({ product }: { product: Product }) {
  const cart = useCart();
  const firstAvailable = product.stock.find((item) => item.available > 0)?.size || "M";
  const [size, setSize] = useState<ProductSize>(firstAvailable);
  const [quantity, setQuantity] = useState(1);
  const [guideOpen, setGuideOpen] = useState(false);
  const selectedStock = product.stock.find((item) => item.size === size);
  const available = product.productStatus === "sold_out" ? 0 : selectedStock?.available || 0;
  const isSoldOut = available <= 0;
  const maxQuantity = product.unlimitedStock ? MAX_ITEM_QUANTITY : Math.min(MAX_ITEM_QUANTITY, Math.max(1, available));
  const wholesaleRules = cart.wholesaleRules.filter(r => r.active && r.product_slug === product.slug);

  function buyOnWhatsApp() {
    const message = `Hola, quiero comprar OVRLMT.\n\nProducto: ${product.name}\nTalla: ${size}\nCantidad: ${quantity}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return <div className="purchase-box">
    <div className="shipping-before-cart"><p>{SHIPPING_COPY}</p><p>{DELIVERY_ESTIMATE}</p></div>
    {wholesaleRules.length > 0 && <div className="product-wholesale"><strong>PRECIO DE MAYOREO</strong><p>Combina tallas de este modelo. El descuento se aplica en el carrito.</p>{wholesaleRules.map(rule => <p key={rule.id}>Desde {rule.min_quantity} piezas: {rule.discount_type === "fixed" ? `$${rule.discount_value} menos por pieza` : `${rule.discount_value}% de descuento`}</p>)}</div>}
    <div className="size-heading"><span>SELECCIONA TU TALLA</span><button type="button" onClick={() => setGuideOpen(true)}><Ruler size={13} /> VER GUÍA DE TALLAS</button></div>
    <div className="size-options" role="group" aria-label="Seleccionar talla">
      {SIZES.map((item) => {
        const stock = product.stock.find((row) => row.size === item);
        const sizeAvailable = product.productStatus === "sold_out" ? 0 : stock?.available || 0;
        return <button key={item} type="button" className={size === item ? "selected" : ""} onClick={() => { setSize(item); setQuantity(1); }} aria-pressed={size === item} disabled={sizeAvailable <= 0}><span>{item}</span></button>;
      })}
    </div>
    <p className={`stock-signal ${!product.unlimitedStock && available <= 2 ? "urgent" : ""}`}>{product.unlimitedStock ? "Disponible sobre pedido" : `${fomo(available)} en talla ${size}`}</p>
    <div className="detail-quantity"><span>CANTIDAD</span><div className="qty-control"><button type="button" aria-label="Restar cantidad" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isSoldOut}><Minus size={12} /></button><input aria-label="Cantidad de piezas" type="number" min="1" max={maxQuantity} value={isSoldOut ? 0 : quantity} disabled={isSoldOut} onChange={e => setQuantity(Math.min(maxQuantity, Math.max(1, Math.floor(Number(e.target.value) || 1))))} /><button type="button" aria-label="Sumar cantidad" onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))} disabled={isSoldOut || quantity >= maxQuantity}><Plus size={12} /></button></div></div>
    <button className="purchase-button" type="button" onClick={() => cart.addItem(product, size, Math.min(quantity, maxQuantity))} disabled={isSoldOut}><span>{isSoldOut ? "AGOTADO" : `AGREGAR AL CARRITO — ${product.price}`}</span><span>↗</span></button>
    <button className="purchase-button secondary" type="button" onClick={buyOnWhatsApp} disabled={isSoldOut}><span>{isSoldOut ? "AGOTADO" : "PEDIR POR WHATSAPP"}</span><span>↗</span></button>
    <p className="purchase-note">{product.unlimitedStock ? "Compra abierta." : "Todo es sobre pedido."} Tu pieza entra a producción después de confirmar el pago.</p>
    {guideOpen && <Modal title="Guía de tallas" onClose={() => setGuideOpen(false)}><SizeGuideContent /></Modal>}
  </div>;
}
