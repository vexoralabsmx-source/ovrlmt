"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [["HOME", "/"], ["DROP", "/drop"], ["STORY", "/story"], ["SIZE GUIDE", "/size-guide"], ["CONTACT", "/contact"]];

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  return <>
    <header className="nav-shell">
      <Link href="/" className="brand-logo" aria-label="OVRLMT Home"><Image src="/brand/ovrlmt-logo.png" alt="OVRLMT" width={132} height={44} priority /></Link>
      <nav className="desktop-nav">{links.map(([label, href]) => <Link className={path === href ? "active" : ""} href={href} key={href}>{label}</Link>)}</nav>
      <Link className="nav-cta" href="/contact">PREORDER <span>↗</span></Link>
      <button className="menu-toggle" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
    </header>
    <AnimatePresence>{open && <motion.div className="mobile-menu" initial={{ clipPath: "inset(0 0 100% 0)" }} animate={{ clipPath: "inset(0 0 0% 0)" }} exit={{ clipPath: "inset(0 0 100% 0)" }} transition={{ duration: .7, ease: [0.77, 0, .18, 1] }}>
      <div className="mobile-top"><Image src="/brand/ovrlmt-logo.png" alt="OVRLMT" width={145} height={48} /><button onClick={() => setOpen(false)} aria-label="Close menu"><X /></button></div>
      <div className="mobile-links">{links.map(([label, href], i) => <motion.div key={href} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .2 + i * .06 }}><span>0{i + 1}</span><Link href={href}>{label}</Link></motion.div>)}</div>
      <div className="mobile-meta"><span>PUEBLA / MEXICO</span><span>EST. 2026</span></div>
    </motion.div>}</AnimatePresence>
  </>;
}
