"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { products } from "@/data/products";

export function PreorderForm() {
  const params = useSearchParams();
  const requested = params.get("piece") || "core-tee";
  const initial = requested === "custom-design" ? "DISEÑO PERSONALIZADO" : products.find((product) => product.slug === requested)?.name || products[0].name;
  const [sent, setSent] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const msg = `Hola, quiero unirme a la preventa de OVRLMT.\nNombre: ${f.get("name")}\nInstagram: ${f.get("instagram")}\nPrenda: ${f.get("piece")}\nTalla: ${f.get("size")}\nComentarios: ${f.get("comments") || "N/A"}`;
    setSent(true); window.open(`https://wa.me/522212683069?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  }
  return <form className="preorder-form" onSubmit={submit}>
    <label><span>01 / NOMBRE</span><input name="name" required placeholder="TU NOMBRE" /></label>
    <label><span>02 / INSTAGRAM</span><input name="instagram" required placeholder="@USUARIO" /></label>
    <label><span>03 / WHATSAPP</span><input name="whatsapp" type="tel" placeholder="+52" /></label>
    <label><span>04 / PRENDA</span><select name="piece" defaultValue={initial}>{products.map(p => <option value={p.name} key={p.slug}>{p.name} — {p.price}</option>)}<option value="DISEÑO PERSONALIZADO">DISEÑO PERSONALIZADO</option></select></label>
    <label><span>05 / TALLA</span><select name="size" defaultValue="M">{["S", "M", "L", "XL", "XXL"].map(s => <option key={s}>{s}</option>)}</select></label>
    <label className="full"><span>06 / COMENTARIOS</span><textarea name="comments" rows={3} placeholder="DETALLES ADICIONALES" /></label>
    <button className="submit-btn" type="submit"><span>{sent ? "OPEN WHATSAPP AGAIN" : "ENVIAR PREORDER"}</span><span>↗</span></button>
  </form>;
}
