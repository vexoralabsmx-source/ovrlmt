import Link from "next/link";
import Image from "next/image";
import { WHATSAPP_NUMBER } from "@/data/store";

const links = [["Inicio", "/"], ["Tienda", "/drop"], ["Contacto", "/contact"], ["Envíos", "/envios"], ["Cambios", "/cambios"], ["Privacidad", "/privacidad"]];

export function Footer() {
  return <footer className="footer">
    <div className="footer-main"><div><Image className="footer-logo" src="/brand/ovrlmt-logo.png" alt="OVRLMT" width={850} height={283} /><p className="footer-tagline">BUILT AFTER DARK</p></div><nav className="footer-links" aria-label="Footer">{links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}</nav><div className="footer-contact"><p>STREETWEAR PREMIUM<br />PUEBLA / MÉXICO</p><Link href="https://instagram.com/ovrlmt.mx" target="_blank" rel="noreferrer">@OVRLMT.MX ↗</Link><Link href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">WHATSAPP ↗</Link><Link href="mailto:contacto@ovrlmt.xyz">CONTACTO@OVRLMT.XYZ</Link><Link href="https://ovrlmt.xyz">OVRLMT.XYZ</Link></div></div>
    <div className="footer-bottom"><span>© 2026 OVRLMT. ALL RIGHTS RESERVED.</span><span>PUEBLA / MÉXICO</span><Link href="https://instagram.com/ovrlmt.mx" target="_blank" rel="noreferrer">INSTAGRAM ↗</Link></div>
  </footer>;
}
