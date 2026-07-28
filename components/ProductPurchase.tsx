"use client";

import { useState } from "react";
import type { Product } from "@/data/products";
import { LOCAL_DELIVERY_COPY, PRODUCT_MATERIAL, SIZE_EQUIVALENCE, SIZES, WHATSAPP_NUMBER, type ProductSize } from "@/data/store";
import { useCart } from "@/components/CartProvider";
import { Minus, Plus, Ruler, X } from "lucide-react";

const sizeRows: Array<{ size: ProductSize; chest: string; length: string; fit: string }> = [
  { size: "CH", chest: "49 cm", length: "68 cm", fit: "Regular S / ajustada premium" },
  { size: "M", chest: "52 cm", length: "71 cm", fit: "Regular M" },
  { size: "G", chest: "55 cm", length: "74 cm", fit: "Regular L / relajada" },
  { size: "XG", chest: "58 cm", length: "77 cm", fit: "XL urbano" },
];

function fomo(available: number) {
  if (available <= 0) return "Agotado";
  if (available === 1) return "Último cupo";
  if (available === 2) return "Solo quedan 2 cupos";
  if (available <= 4) return "Pocos cupos";
  return `${available} cupos`;
}

export function ProductPurchase({ product }: { product: Product }) {
  const cart = useCart();
  const firstAvailable = product.stock.find((item) => item.available > 0)?.size || "M";
  const [size, setSize] = useState<ProductSize>(firstAvailable);
  const [quantity, setQuantity] = useState(1);
  const [guideOpen, setGuideOpen] = useState(false);
  const selectedStock = product.stock.find((item) => item.size === size);
  const available = product.productStatus === "sold_out" ? 0 : selectedStock?.available || 0;
  const isSoldOut = available <= 0;
  const maxQuantity = Math.max(1, available);

  function preorder() {
    const message = `Hola, quiero preordenar OVRLMT.\n\nProducto: ${product.name}\nTalla: ${size}\nCantidad: ${quantity}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return <div className="purchase-box">
    <div className="purchase-highlights"><div><span>MATERIAL</span><b>{product.material || PRODUCT_MATERIAL}</b></div><div><span>ENTREGA LOCAL</span><b>{LOCAL_DELIVERY_COPY}</b></div></div>
    <div className="size-heading"><span>SELECCIONA TU TALLA</span><button type="button" onClick={() => setGuideOpen(true)}><Ruler size={13} /> VER GUÍA DE TALLAS</button></div>
    <div className="size-options" role="group" aria-label="Seleccionar talla">
      {SIZES.map((item) => {
        const stock = product.stock.find((row) => row.size === item);
        const sizeAvailable = product.productStatus === "sold_out" ? 0 : stock?.available || 0;
        return <button key={item} type="button" className={size === item ? "selected" : ""} onClick={() => { setSize(item); setQuantity(1); }} aria-pressed={size === item} disabled={sizeAvailable <= 0}><span>{item}</span><small>{fomo(sizeAvailable)}</small></button>;
      })}
    </div>
    <p className={`stock-signal ${available <= 2 ? "urgent" : ""}`}>{fomo(available)} en talla {size} <span>({SIZE_EQUIVALENCE[size]})</span></p>
    <div className="detail-quantity"><span>CANTIDAD</span><div className="qty-control"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isSoldOut}><Minus size={12} /></button><span>{isSoldOut ? 0 : quantity}</span><button type="button" onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))} disabled={isSoldOut || quantity >= maxQuantity}><Plus size={12} /></button></div></div>
    <button className="purchase-button" type="button" onClick={() => cart.addItem(product, size, Math.min(quantity, maxQuantity))} disabled={isSoldOut}><span>{isSoldOut ? "AGOTADO" : `AGREGAR AL CARRITO — ${product.price}`}</span><span>↗</span></button>
    <button className="purchase-button secondary" type="button" onClick={preorder} disabled={isSoldOut}><span>{isSoldOut ? "AGOTADO" : "PREORDENAR POR WHATSAPP"}</span><span>↗</span></button>
    <p className="purchase-note">Todo es sobre pedido. Tu pieza entra a producción después de confirmar el pago y validar el comprobante.</p>
    {guideOpen && <div className="size-modal-layer" role="dialog" aria-modal="true" aria-label="Guía de tallas">
      <button className="size-modal-backdrop" type="button" onClick={() => setGuideOpen(false)} aria-label="Cerrar guía" />
      <div className="size-modal">
        <header><div><span>FIT SYSTEM / OVRLMT</span><h2>Guía de tallas.</h2></div><button type="button" onClick={() => setGuideOpen(false)} aria-label="Cerrar"><X size={18} /></button></header>
        <table><thead><tr><th>Talla</th><th>Equiv.</th><th>Axila a axila</th><th>Largo</th><th>Fit</th></tr></thead><tbody>{sizeRows.map((row) => <tr key={row.size}><td>{row.size}</td><td>{SIZE_EQUIVALENCE[row.size]}</td><td>{row.chest}</td><td>{row.length}</td><td>{row.fit}</td></tr>)}</tbody></table>
        <p>Mide una playera que te quede bien y compárala con esta tabla. No hay cambios por error de talla en preorder.</p>
      </div>
    </div>}
  </div>;
}
