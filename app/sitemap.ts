import type { MetadataRoute } from "next";
import { products } from "@/data/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ovrlmt.xyz";
  const routes = ["", "/drop", "/contact", "/cart", "/story", "/size-guide", "/envios", "/cambios", "/privacidad"];
  return [...routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date(), changeFrequency: route === "" || route === "/drop" ? "weekly" as const : "monthly" as const, priority: route === "" ? 1 : .7 })), ...products.map((product) => ({ url: `${base}/drop/${product.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: .9 }))];
}
