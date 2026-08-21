import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";
import { InitialLoader } from "@/components/InitialLoader";
import { FREE_SHIPPING_MINIMUM, LOCAL_DELIVERY_AREA } from "@/data/store";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL("https://ovrlmt.xyz"),
  title: { default: "OVRLMT — Streetwear Built After Dark", template: "%s — OVRLMT" },
  description: "Streetwear mexicano producido sobre pedido, inspirado en motorsport nocturno, velocidad, asfalto y cultura urbana. Drops limitados y preorder online.",
  keywords: ["OVRLMT", "streetwear México", "ropa urbana premium", "playeras premium", "playeras edición limitada"],
  icons: { icon: "/brand/favicon.png", shortcut: "/brand/favicon.png", apple: "/brand/favicon.png" },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "es_MX", url: "https://ovrlmt.xyz", siteName: "OVRLMT",
    title: "OVRLMT — Streetwear Built After Dark",
    description: "Streetwear mexicano producido sobre pedido, inspirado en motorsport nocturno, velocidad, asfalto y cultura urbana. Drops limitados y preorder online.",
    images: [{ url: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_53_p.m._3_f1cqbm.png", width: 1200, height: 630, alt: "OVRLMT Drop 001" }],
  },
  twitter: { card: "summary_large_image", title: "OVRLMT — Streetwear Built After Dark", description: "Streetwear mexicano sobre pedido. Drops limitados y preorder online.", images: ["https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_53_p.m._3_f1cqbm.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-scroll-behavior="smooth"><body suppressHydrationWarning className={`${display.variable} ${body.variable}`}><CartProvider><InitialLoader /><div className="noise" /><div className="shipping-bar"><strong>TODO ES SOBRE PEDIDO</strong><span>· PRODUCCIÓN AL CONFIRMAR TU PAGO</span><span className="shipping-bar-extra">· ENVÍO GRATIS A TODO MÉXICO DESDE ${FREE_SHIPPING_MINIMUM.toLocaleString("es-MX")} MXN · ENTREGA GRATIS EN {LOCAL_DELIVERY_AREA.toUpperCase()}</span></div><Header />{children}<Footer /></CartProvider></body></html>;
}
