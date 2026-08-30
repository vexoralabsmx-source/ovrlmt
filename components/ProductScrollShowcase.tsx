"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/data/products";

function ShowcaseItem({ product, index }: { product: Product; index: number }) {
  const reduceMotion = useReducedMotion();

  return <motion.article
    className="scroll-product-item"
    initial={reduceMotion ? false : { opacity: 0, y: 44 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: .42 }}
    transition={{ duration: .75, ease: [0.22, 1, .36, 1] }}
  >
    <div className="scroll-product-copy">
      <span>0{index + 1} / {product.code}</span>
      <h3>{product.name}<small>{product.piece}</small></h3>
      <p>{product.story}</p>
    </div>
    <motion.div
      className="scroll-product-image"
      initial={reduceMotion ? false : { scale: .96, opacity: .7 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: false, amount: .5 }}
      transition={{ duration: .9, ease: [0.22, 1, .36, 1] }}
    >
      <Image src={product.image} alt={`${product.name} ${product.piece}`} fill sizes="(max-width: 900px) 90vw, 42vw" />
    </motion.div>
  </motion.article>;
}

export function ProductScrollShowcase({ products }: { products: Product[] }) {
  return <section className="scroll-products">
    <div className="scroll-products-head">
      <div>
        <p className="section-label">02 / DROP 001</p>
        <h2>TRES PIEZAS.<br />UNA MISMA NOCHE.</h2>
      </div>
      <p>Premium feel. Motorsport soul. Compra abierta.</p>
    </div>
    <div className="scroll-products-list">
      {products.map((product, index) => <ShowcaseItem product={product} index={index} key={product.slug} />)}
    </div>
  </section>;
}
