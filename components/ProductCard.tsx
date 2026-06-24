"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useState, type MouseEvent } from "react";
import type { Product } from "@/data/products";
import { SIZES, type ProductSize } from "@/data/store";
import { useCart } from "@/components/CartProvider";

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const cart = useCart();
  const [size, setSize] = useState<ProductSize>("M");
  const [quantity, setQuantity] = useState(1);
  const x = useMotionValue(0), y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-.5, .5], [6, -6]), { stiffness: 180, damping: 20 });
  const ry = useSpring(useTransform(x, [-.5, .5], [-6, 6]), { stiffness: 180, damping: 20 });
  const move = (e: MouseEvent<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX-r.left)/r.width-.5); y.set((e.clientY-r.top)/r.height-.5); };
  return <motion.article className="product-card" style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} onMouseMove={move} onMouseLeave={() => { x.set(0); y.set(0); }} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08, duration: .7 }}>
    <Link className={`product-visual ${product.accent}`} href={`/drop/${product.slug}`} aria-label={`Ver detalles de ${product.name}`}>
      <span className="product-index">0{index + 1}</span><span className="product-code">{product.code}</span>
      <Image className="product-image" src={product.image} alt={`${product.name} — Drop 001 OVRLMT`} fill sizes="(max-width: 900px) 100vw, 33vw" />
      <div className="scanline" />
      <span className="product-view">VER DETALLES ↗</span>
    </Link>
    <div className="product-info"><div><p>PREORDEN LIMITADA</p><h3>{product.name}</h3></div><span>{product.price}</span></div>
    <div className="quick-buy">
      <div className="quick-buy-row"><div className="card-sizes" aria-label="Seleccionar talla">{SIZES.map((item) => <button key={item} type="button" className={size === item ? "selected" : ""} onClick={() => setSize(item)}>{item}</button>)}</div><div className="card-qty"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Restar cantidad"><Minus size={11} /></button><span>{quantity}</span><button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Sumar cantidad"><Plus size={11} /></button></div></div>
      <button className="add-cart" type="button" onClick={() => cart.addItem(product, size, quantity)}>AGREGAR AL CARRITO <span>↗</span></button>
    </div>
    <div className="product-actions"><span>{product.units} PIEZAS / {product.fit}</span><Link href={`/drop/${product.slug}`}>VER DETALLES ↗</Link></div>
  </motion.article>;
}
