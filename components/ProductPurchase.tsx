"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/data/products";

const sizes = ["S", "M", "L", "XL", "XXL"];

export function ProductPurchase({ product }: { product: Product }) {
  const [size, setSize] = useState("M");
  const message = `Hola, quiero pedir la ${product.name} (${product.code}) del DROP 001.\nTalla: ${size}\nPrecio: ${product.price}\n¿Sigue disponible?`;

  return <div className="purchase-box">
    <div className="size-heading"><span>SELECCIONA TU TALLA</span><Link href="/size-guide">VER GUÍA DE TALLAS ↗</Link></div>
    <div className="size-options" role="group" aria-label="Seleccionar talla">
      {sizes.map((item) => <button key={item} type="button" className={size === item ? "selected" : ""} onClick={() => setSize(item)} aria-pressed={size === item}>{item}</button>)}
    </div>
    <a className="purchase-button" href={`https://wa.me/522212683069?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"><span>PEDIR POR WHATSAPP — {product.price}</span><span>↗</span></a>
    <p className="purchase-note">Tu pedido se confirma directamente por WhatsApp. La selección de talla no reserva inventario hasta recibir confirmación.</p>
  </div>;
}
