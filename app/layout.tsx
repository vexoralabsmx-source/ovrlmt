import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "OVRLMT — Built After Dark", template: "%s — OVRLMT" },
  description: "Streetwear mexicano inspirado en velocidad, ciudad y límites rotos.",
  icons: { icon: "/brand/favicon.png", shortcut: "/brand/favicon.png", apple: "/brand/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body suppressHydrationWarning className={`${display.variable} ${body.variable}`}><CartProvider><div className="noise" /><div className="shipping-bar">ENVÍO GRATIS A PARTIR DE $1,500 MXN</div><Header />{children}<Footer /></CartProvider></body></html>;
}
