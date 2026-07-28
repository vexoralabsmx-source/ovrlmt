"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";
import type { ProductSize } from "@/data/store";
import { FREE_SHIPPING_MINIMUM, PRODUCT_PRICE, SHIPPING_COST } from "@/data/store";
import { CartDrawer } from "@/components/CartDrawer";

export type CartItem = Pick<Product, "slug" | "name" | "image"> & { size: ProductSize; quantity: number; priceMxn: number };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  isOpen: boolean;
  addItem: (product: Product, size: ProductSize, quantity: number) => void;
  updateQuantity: (slug: string, size: ProductSize, quantity: number) => void;
  removeItem: (slug: string, size: ProductSize) => void;
  clearCart: () => void;
  replaceItems: (items: CartItem[]) => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ovrlmt-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch { localStorage.removeItem(STORAGE_KEY); }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items, hydrated]);
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * (item.priceMxn || PRODUCT_PRICE), 0);
  const shipping = subtotal > 0 && subtotal < FREE_SHIPPING_MINIMUM ? SHIPPING_COST : 0;
  const total = subtotal + shipping;
  const itemCount = hydrated ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  const value = useMemo<CartContextValue>(() => ({
    items, itemCount, subtotal, shipping, total, isOpen,
    addItem(product, size, quantity) {
      setItems((current) => {
        const found = current.find((item) => item.slug === product.slug && item.size === size);
        if (found) return current.map((item) => item === found ? { ...item, quantity: item.quantity + quantity } : item);
        return [...current, { slug: product.slug, name: product.name, image: product.image, priceMxn: product.priceMxn || PRODUCT_PRICE, size, quantity }];
      });
      setIsOpen(true);
    },
    updateQuantity(slug, size, quantity) { setItems((current) => current.map((item) => item.slug === slug && item.size === size ? { ...item, quantity: Math.max(1, quantity) } : item)); },
    removeItem(slug, size) { setItems((current) => current.filter((item) => !(item.slug === slug && item.size === size))); },
    clearCart() { setItems([]); },
    replaceItems(nextItems) { setItems(nextItems); setIsOpen(true); },
    openCart() { setIsOpen(true); }, closeCart() { setIsOpen(false); },
  }), [items, itemCount, subtotal, shipping, total, isOpen]);

  return <CartContext.Provider value={value}>{children}<CartDrawer /></CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
