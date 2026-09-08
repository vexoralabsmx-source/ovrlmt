import type { MetadataRoute } from "next";
import { getCatalogProducts } from "@/src/lib/catalog";
import { productUrl } from "@/data/commerce";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://ovrlmt.xyz";
  const routes = ["", "/drop", "/contact", "/story", "/size-guide", "/envios", "/cambios", "/privacidad", "/personalizados"];
  const products = await getCatalogProducts();
  return [...routes.map(route => ({ url: `${base}${route}`, changeFrequency: "weekly" as const, priority: route === "" ? 1 : .7 })), ...products.map(product => ({ url: `${base}${productUrl(product.slug)}`, changeFrequency: "weekly" as const, priority: .8 }))];
}
