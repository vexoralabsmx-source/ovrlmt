"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { Modal } from "./Modal";
import { CURRENT_DROP_URL } from "@/data/commerce";
const links = [
  ["INICIO", "/"],
  ["TIENDA", "/drop"],
  ["DROP 004", CURRENT_DROP_URL],
  ["GUÍA DE TALLAS", "/size-guide"],
  ["PEDIDOS", "/cuenta"],
];
export function Header() {
  const cart = useCart();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="nav-shell">
        <Link href="/" className="brand-logo" aria-label="OVRLMT Inicio">
          <Image
            src="/brand/ovrlmt-logo.png"
            alt="OVRLMT"
            width={132}
            height={44}
          />
        </Link>
        <nav className="desktop-nav" aria-label="Principal">
          {links.map(([label, href]) => (
            <Link
              className={path === href ? "active" : ""}
              key={href}
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link className="nav-cta" href={CURRENT_DROP_URL}>COMPRAR <span>↗</span></Link>
        <button
          className="cart-toggle"
          onClick={cart.openCart}
          aria-label={`Abrir carrito, ${cart.itemCount} productos`}
        >
          <ShoppingBag size={17} />
          <span>{cart.itemCount}</span>
        </button>
        <button
          className="menu-toggle"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          <Menu size={22} />
        </button>
      </header>
      {open && (
        <Modal className="mobile-menu-dialog" title="OVRLMT" onClose={() => setOpen(false)}>
          <nav className="menu-links" aria-label="Navegación móvil">
            {links.map(([label, href], i) => (
              <Link href={href} key={href} onClick={() => setOpen(false)}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {label}
              </Link>
            ))}
            <Link href="/cart" onClick={() => setOpen(false)}>
              <span>06</span>CARRITO
            </Link>
          </nav>
        </Modal>
      )}
    </>
  );
}
