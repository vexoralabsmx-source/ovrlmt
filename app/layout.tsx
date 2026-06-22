import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "OVRLMT — Built After Dark", template: "%s — OVRLMT" },
  description: "Streetwear mexicano inspirado en velocidad, ciudad y límites rotos.",
  icons: { icon: "/brand/favicon.png", shortcut: "/brand/favicon.png", apple: "/brand/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body suppressHydrationWarning className={`${display.variable} ${body.variable}`}><div className="noise" /><Header />{children}<Footer /></body></html>;
}
