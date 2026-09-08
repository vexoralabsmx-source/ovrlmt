"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { CURRENT_DROP_URL, garmentType, productUrl } from "@/data/commerce";
import { ArrowUpRight } from "lucide-react";

function NaomiPieceGroup({ products, duplicate = false }: { products: Product[]; duplicate?: boolean }) {
  return (
    <div className="naomi-marquee-group" aria-hidden={duplicate || undefined}>
      {products.map((piece) => (
        <Link className="naomi-piece" href={productUrl(piece.slug)} key={`${duplicate ? "copy-" : ""}${piece.slug}`} tabIndex={duplicate ? -1 : undefined}>
          <div className="naomi-piece-image">
            <Image
              src={piece.image}
              alt={duplicate ? "" : piece.name}
              fill
              loading="lazy"
              sizes="(max-width: 700px) 82vw, (max-width: 1200px) 46vw, 34vw"
            />
            <span>{piece.piece}</span>
            <i>NAYIOMI.KO × OVRLMT</i>
          </div>
          <div className="naomi-piece-copy">
            <div>
              <span>{garmentType(piece)} / {piece.fit}</span>
              <h3>{piece.name}</h3>
            </div>
            <strong>{piece.price}</strong>
            <ArrowUpRight aria-hidden="true" size={18} />
          </div>
        </Link>
      ))}
    </div>
  );
}

export function NaomiDropShowcase({ products }: { products: Product[] }) {
  const reduceMotion = useReducedMotion();
  const enter = (delay: number, x = 0, y = 32) => ({
    initial: reduceMotion ? false as const : { opacity: 0, x, y },
    whileInView: { opacity: 1, x: 0, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: reduceMotion ? 0 : 0.75, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <motion.section className="naomi-drop" aria-labelledby="naomi-drop-title" initial={reduceMotion ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-120px" }} transition={{ duration: reduceMotion ? 0 : 0.45 }}>
      <div className="naomi-drop-glow" aria-hidden="true" />
      <header className="naomi-drop-head">
        <motion.div className="naomi-drop-meta" {...enter(0.05, -28, 0)}>
          <p className="section-label">DROP 004 / COLLABORATION FILE</p>
          <span className="naomi-live"><i /> VENTA OFICIAL</span>
        </motion.div>
        <motion.h2 id="naomi-drop-title" {...enter(0.12, 0, 44)}>NAYIOMI.KO<br /><em>× OVRLMT</em></motion.h2>
        <motion.div className="naomi-drop-copy" {...enter(0.2, 28, 0)}>
          <p>Tres piezas construidas entre boxeo, velocidad y flor de cerezo. Negro lavado, gráficos de alto contraste y producción sobre pedido.</p>
          <div className="naomi-release">
            <span>YA DISPONIBLE</span>
            <strong>VENTA OFICIAL</strong>
            <small>COMPRA ABIERTA / PRODUCCIÓN SOBRE PEDIDO</small>
          </div>
        </motion.div>
      </header>

      <motion.div className="naomi-marquee" aria-label="Piezas del drop Nayiomi.ko por OVRLMT" {...enter(0.18, 0, 46)}>
        <div className="naomi-marquee-track">
          <NaomiPieceGroup products={products} />
          <NaomiPieceGroup products={products} duplicate />
        </div>
      </motion.div>

      <motion.footer className="naomi-drop-foot" {...enter(0.1, 0, 24)}>
        <span>PLAYERAS / $359 MXN</span>
        <span>SUDADERAS / $459 MXN</span>
        <span>PRODUCCIÓN SOBRE PEDIDO</span>
        <span>VENTA OFICIAL / ONLINE</span>
        <Link href={CURRENT_DROP_URL}>VER DROP COMPLETO <ArrowUpRight aria-hidden="true" size={16} /></Link>
      </motion.footer>
    </motion.section>
  );
}
