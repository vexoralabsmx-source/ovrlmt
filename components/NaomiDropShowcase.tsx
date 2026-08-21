"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const naomiPieces = [
  {
    slug: "naomi-cherry-blossom-gt3-hoodie",
    piece: "01 / 03",
    type: "SUDADERA / CORTE REGULAR",
    name: "Cherry Blossom × GT3 RS",
    price: "$459 MXN",
    image: "/drops/naomi/cherry-blossom-gt3-hoodie.webp",
    alt: "Sudadera negra Naomi Cherry Blossom con diseño de boxeadora, flores y automóvil GT3 RS",
  },
  {
    slug: "naomi-boxing-strike-tee",
    piece: "02 / 03",
    type: "PLAYERA / CORTE REGULAR",
    name: "Boxing Strike",
    price: "$359 MXN",
    image: "/drops/naomi/boxing-strike-tee.webp",
    alt: "Playera negra Naomi Boxing Strike con boxeadora, flores rosas y automóvil deportivo",
  },
  {
    slug: "naomi-title-champion-hoodie",
    piece: "03 / 03",
    type: "SUDADERA / CORTE REGULAR",
    name: "Title Champion",
    price: "$459 MXN",
    image: "/drops/naomi/title-champion-hoodie.webp",
    alt: "Sudadera negra Naomi Title Champion con boxeadora y flores rosas",
  },
] as const;

function NaomiPieceGroup({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className="naomi-marquee-group" aria-hidden={duplicate || undefined}>
      {naomiPieces.map((piece) => (
        <Link className="naomi-piece" href={`/drop/${piece.slug}`} key={`${duplicate ? "copy-" : ""}${piece.slug}`} tabIndex={duplicate ? -1 : undefined}>
          <div className="naomi-piece-image">
            <Image
              src={piece.image}
              alt={duplicate ? "" : piece.alt}
              fill
              loading="eager"
              unoptimized
              sizes="(max-width: 700px) 82vw, (max-width: 1200px) 46vw, 34vw"
            />
            <span>{piece.piece}</span>
            <i>NAYIOMI.KO × OVRLMT</i>
          </div>
          <div className="naomi-piece-copy">
            <div>
              <span>{piece.type}</span>
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

export function NaomiDropShowcase() {
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
          <NaomiPieceGroup />
          <NaomiPieceGroup duplicate />
        </div>
      </motion.div>

      <motion.footer className="naomi-drop-foot" {...enter(0.1, 0, 24)}>
        <span>PLAYERAS / $359 MXN</span>
        <span>SUDADERAS / $459 MXN</span>
        <span>STOCK ILIMITADO</span>
        <span>VENTA OFICIAL / ONLINE</span>
        <Link href="/drop">VER DROP COMPLETO <ArrowUpRight aria-hidden="true" size={16} /></Link>
      </motion.footer>
    </motion.section>
  );
}
