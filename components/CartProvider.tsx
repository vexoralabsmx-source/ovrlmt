"use client";
import { MAX_ITEM_QUANTITY, calculateWholesale, type WholesaleRule } from "@/data/wholesale";


import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";
import { SIZES, type ProductSize } from "@/data/store";
import { FREE_SHIPPING_MINIMUM, PRODUCT_PRICE, SHIPPING_COST } from "@/data/store";
import { CartDrawer } from "@/components/CartDrawer";

export type CartItem = Pick<Product, "slug" | "name" | "image"> & { size: ProductSize; quantity: number; priceMxn: number };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  wholesaleDiscount: number;
  wholesaleRules: WholesaleRule[];
  pricingError: string;
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
  const [wholesaleRules, setWholesaleRules] = useState<WholesaleRule[]>([]);
  const [pricingError, setPricingError] = useState("Verificando precios de mayoreo…");
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed.filter((item): item is CartItem => Boolean(item) && typeof item === "object" && typeof item.slug === "string" && typeof item.name === "string" && typeof item.image === "string" && SIZES.includes(item.size) && Number.isFinite(item.priceMxn) && item.priceMxn > 0 && Number.isInteger(item.quantity) && item.quantity > 0).map(item => ({ ...item, quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity) })));
      }
    } catch { /* Storage can be unavailable in private browsing. */ }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* The cart remains usable in memory. */ } } }, [items, hydrated]);
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/wholesale", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
        if (!response.ok) throw new Error();
        const json = await response.json();
        if (!controller.signal.aborted) { setWholesaleRules(json.rules); setPricingError(""); }
      } catch { if (!controller.signal.aborted) setPricingError("No pudimos actualizar los precios de mayoreo. Recarga antes de pagar."); }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); window.removeEventListener("focus", refresh); };
  }, []);
  const subtotal = items.reduce((sum, item) => sum + item.quantity * (item.priceMxn || PRODUCT_PRICE), 0);
  const wholesaleDiscount = calculateWholesale(items, wholesaleRules).discountMxn;
  const netSubtotal = subtotal - wholesaleDiscount;
  const shipping = netSubtotal > 0 && netSubtotal < FREE_SHIPPING_MINIMUM ? SHIPPING_COST : 0;
  const total = netSubtotal + shipping;
  const itemCount = hydrated ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  const value = useMemo<CartContextValue>(() => ({
    items, itemCount, subtotal, wholesaleDiscount, wholesaleRules, pricingError, shipping, total, isOpen,
    addItem(product, size, quantity) {
      if (product.productStatus !== "active" || !Number.isInteger(quantity) || quantity < 1 || !SIZES.includes(size)) return;
      quantity = Math.min(MAX_ITEM_QUANTITY, quantity);
      setItems((current) => {
        const found = current.find((item) => item.slug === product.slug && item.size === size);
        if (found) return current.map((item) => item === found ? { ...item, quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity + quantity) } : item);
        return [...current, { slug: product.slug, name: product.name, image: product.image, priceMxn: product.priceMxn || PRODUCT_PRICE, size, quantity }];
      });
      setIsOpen(true);
    },
    updateQuantity(slug, size, quantity) { setItems((current) => current.map((item) => item.slug === slug && item.size === size ? { ...item, quantity: Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(quantity))) } : item)); },
    removeItem(slug, size) { setItems((current) => current.filter((item) => !(item.slug === slug && item.size === size))); },
    clearCart() { setItems([]); },
    replaceItems(nextItems) { setItems(nextItems); setIsOpen(true); },
    openCart() { setIsOpen(true); }, closeCart() { setIsOpen(false); },
  }), [items, itemCount, subtotal, wholesaleDiscount, wholesaleRules, pricingError, shipping, total, isOpen]);

  return <CartContext.Provider value={value}>{children}<CartDrawer /></CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
