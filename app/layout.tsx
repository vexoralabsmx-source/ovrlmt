import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";

import { FREE_SHIPPING_MINIMUM } from "@/data/store";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL("https://ovrlmt.xyz"),
  title: { default: "OVRLMT — Streetwear Built After Dark", template: "%s — OVRLMT" },
  description: "Streetwear mexicano producido sobre pedido, inspirado en motorsport nocturno, velocidad, asfalto y cultura urbana. Colecciones y compra online.",
  keywords: ["OVRLMT", "streetwear México", "ropa urbana premium", "playeras premium", "playeras edición limitada"],
  icons: { icon: "/brand/favicon-32.png", shortcut: "/brand/favicon-32.png", apple: "/brand/apple-touch-icon.png" },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "es_MX", url: "https://ovrlmt.xyz", siteName: "OVRLMT",
    title: "OVRLMT — Streetwear Built After Dark",
    description: "Streetwear mexicano producido sobre pedido, inspirado en motorsport nocturno, velocidad, asfalto y cultura urbana. Colecciones y compra online.",
    images: [{ url: "/drops/naomi/cherry-blossom-gt3-hoodie.webp", alt: "OVRLMT — Built After Dark" }],
  },
  twitter: { card: "summary_large_image", title: "OVRLMT — Streetwear Built After Dark", description: "Streetwear mexicano sobre pedido. Colecciones y compra online.", images: ["/drops/naomi/cherry-blossom-gt3-hoodie.webp"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-scroll-behavior="smooth"><body suppressHydrationWarning className={`${display.variable} ${body.variable}`}><CartProvider><a className="skip-link" href="#main-content">Saltar al contenido</a><div className="noise" /><div className="shipping-bar"><strong>ENVÍO GRATIS DESDE ${FREE_SHIPPING_MINIMUM.toLocaleString("es-MX")} MXN</strong><span className="shipping-bar-extra">· PRODUCIDO EN PUEBLA · ENTREGA PERSONAL SIN COSTO</span></div><Header />{children}<Footer /></CartProvider></body></html>;
}
