import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return <footer className="footer">
    <div className="footer-main"><Image className="footer-logo" src="/brand/ovrlmt-logo.png" alt="OVRLMT" width={850} height={283} /><p>MADE FOR THE ONES<br />WHO MOVE DIFFERENT.</p></div>
    <div className="footer-bottom"><span>© 2026 OVRLMT</span><span>PUEBLA / MEXICO</span><Link href="https://instagram.com/ovrlmt.mx" target="_blank">INSTAGRAM ↗</Link></div>
  </footer>;
}
