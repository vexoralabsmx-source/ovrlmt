"use client";
import { MAX_ITEM_QUANTITY } from "@/data/wholesale";


import { availabilityLabel as fomo, productUrl, garmentType } from "@/data/commerce";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useState, type MouseEvent } from "react";
import type { Product } from "@/data/products";
import { PRODUCT_MATERIAL, SIZES, type ProductSize } from "@/data/store";
import { useCart } from "@/components/CartProvider";

function stockSummary(product: Product) {
  const total = product.stock.reduce((sum, item) => sum + item.available, 0);
  return product.productStatus === "sold_out" ? 0 : total;
}


export function ProductCard({ product, index }: { product: Product; index: number }) {
  const cart = useCart();
  const firstAvailable = product.stock.find((item) => item.available > 0)?.size || "M";
  const [size, setSize] = useState<ProductSize>(firstAvailable);
  const [quantity, setQuantity] = useState(1);
  const reduceMotion = useReducedMotion();
  const available = stockSummary(product);
  const selectedAvailable = product.productStatus === "sold_out" ? 0 : product.stock.find((item) => item.size === size)?.available || 0;
  const selectedLimit = product.unlimitedStock ? MAX_ITEM_QUANTITY : selectedAvailable;
  const isSoldOut = selectedAvailable <= 0;
  const x = useMotionValue(0), y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-.5, .5], [6, -6]), { stiffness: 180, damping: 20 });
  const ry = useSpring(useTransform(x, [-.5, .5], [-6, 6]), { stiffness: 180, damping: 20 });
  const move = (e: MouseEvent<HTMLElement>) => { if (reduceMotion) return; const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX-r.left)/r.width-.5); y.set((e.clientY-r.top)/r.height-.5); };
  return <motion.article className="product-card" style={reduceMotion ? undefined : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} onMouseMove={move} onMouseLeave={() => { x.set(0); y.set(0); }} initial={reduceMotion ? false : { opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduceMotion ? 0 : index * .08, duration: reduceMotion ? 0 : .7 }}>
    <Link className={`product-visual ${product.accent}`} href={productUrl(product.slug)} aria-label={`Ver detalles de ${product.name}`}>
      <span className="product-index">{String(index + 1).padStart(2, "0")}</span><span className="product-code">{product.code}</span>
      <span className={`stock-badge ${!product.unlimitedStock && available <= 2 ? "urgent" : ""}`}>{fomo(available, product.unlimitedStock)}</span>
      <Image className="product-image" src={product.image} alt={`${product.name}, pieza ${product.piece} de OVRLMT`} fill sizes="(max-width: 900px) 100vw, 33vw" loading="lazy" />
      <div className="scanline" />
      <span className="product-view">VER DETALLES ↗</span>
    </Link>
    <div className="product-info"><div><p>{garmentType(product)} / {product.drop === "STORE" ? "TIENDA GENERAL" : `DROP ${product.drop}`} / PIEZA {product.piece}</p><h3>{product.name}</h3></div><span>{product.price}</span></div>
    <div className="product-card-meta"><span>{product.material || PRODUCT_MATERIAL}</span><span>{product.fit}</span></div>
    <div className="quick-buy">
      <div className="quick-buy-row"><div className="card-sizes" aria-label="Seleccionar talla">{SIZES.map((item) => {
        const sizeAvailable = product.productStatus === "sold_out" ? 0 : product.stock.find((row) => row.size === item)?.available || 0;
        return <button key={item} type="button" aria-pressed={size === item} className={size === item ? "selected" : ""} onClick={() => { setSize(item); setQuantity(1); }} disabled={sizeAvailable <= 0}>{item}</button>;
      })}</div><div className="card-qty"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Restar cantidad" disabled={isSoldOut}><Minus size={11} /></button><span>{isSoldOut ? 0 : quantity}</span><button type="button" onClick={() => setQuantity(Math.min(selectedLimit, quantity + 1))} aria-label="Sumar cantidad" disabled={isSoldOut || quantity >= selectedLimit}><Plus size={11} /></button></div></div>
      <button className="add-cart" type="button" onClick={() => cart.addItem(product, size, Math.min(quantity, selectedLimit))} disabled={isSoldOut}>{isSoldOut ? "AGOTADO" : "AGREGAR AL CARRITO"} <span>↗</span></button>
    </div>
    <div className="product-actions"><span>{fomo(available, product.unlimitedStock)} / {product.fit}</span><Link href={productUrl(product.slug)}>VER DETALLES ↗</Link></div>
  </motion.article>;
}
