"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import type { Product } from "@/data/products";

export function ProductCard({ product, index }: { product: Product; index: number }) {
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
    <div className="product-info"><div><p>{product.status}</p><h3>{product.name}</h3></div><span>{product.price}</span></div>
    <div className="product-actions"><span>{product.units} PIEZAS / {product.fit}</span><Link href={`/drop/${product.slug}`}>VER DETALLES ↗</Link></div>
  </motion.article>;
}
