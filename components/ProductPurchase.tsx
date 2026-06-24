"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/data/products";
import { SIZES, type ProductSize } from "@/data/store";
import { useCart } from "@/components/CartProvider";
import { Minus, Plus } from "lucide-react";

export function ProductPurchase({ product }: { product: Product }) {
  const cart = useCart();
  const [size, setSize] = useState<ProductSize>("M");
  const [quantity, setQuantity] = useState(1);

  return <div className="purchase-box">
    <div className="size-heading"><span>SELECCIONA TU TALLA</span><Link href="/size-guide">VER GUÍA DE TALLAS ↗</Link></div>
    <div className="size-options" role="group" aria-label="Seleccionar talla">
      {SIZES.map((item) => <button key={item} type="button" className={size === item ? "selected" : ""} onClick={() => setSize(item)} aria-pressed={size === item}>{item}</button>)}
    </div>
    <div className="detail-quantity"><span>CANTIDAD</span><div className="qty-control"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={12} /></button><span>{quantity}</span><button type="button" onClick={() => setQuantity(quantity + 1)}><Plus size={12} /></button></div></div>
    <button className="purchase-button" type="button" onClick={() => cart.addItem(product, size, quantity)}><span>AGREGAR AL CARRITO — {product.price}</span><span>↗</span></button>
    <p className="purchase-note">Preorden limitada. Tu pieza queda apartada después de enviar el comprobante de pago.</p>
  </div>;
}
