import "server-only";
import { cache } from "react";
import { availabilityLabel } from "@/data/commerce";
import {
  products as fallbackProducts,
  type Product,
  type ProductStatus,
} from "@/data/products";
import { SIZES, type ProductSize } from "@/data/store";
import { getSupabaseAdmin } from "@/src/lib/supabaseAdmin";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  drop_number: string | null;
  price_mxn: number;
  image_url: string | null;
  images: string[] | null;
  active: boolean | null;
  status: ProductStatus | null;
  description: string | null;
  color: string | null;
  fit: string | null;
  material: string | null;
  print_method: string | null;
  featured: boolean | null;
  story: string | null;
  code: string | null;
  accent: Product["accent"] | null;
};

type StockRow = {
  product_id: string;
  size: ProductSize;
  total: number;
  reserved: number;
  sold: number;
};

const UNLIMITED_STOCK_SLUGS = new Set([
  "naomi-cherry-blossom-gt3-hoodie",
  "naomi-boxing-strike-tee",
  "naomi-title-champion-hoodie",
]);

export function isUnlimitedStockProductSlug(slug: string) {
  return UNLIMITED_STOCK_SLUGS.has(slug);
}

function money(value: number) {
  return `$${Number(value).toLocaleString("es-MX")} MXN`;
}

function normalizeStock(rows: StockRow[]) {
  return SIZES.map((size) => {
    const row = rows.find((item) => item.size === size);
    const total = Number(row?.total || 0);
    const reserved = Number(row?.reserved || 0);
    const sold = Number(row?.sold || 0);
    return {
      size,
      total,
      reserved,
      sold,
      available: Math.max(0, total - reserved - sold),
    };
  });
}

function fromRows(productRows: ProductRow[], stockRows: StockRow[]): Product[] {
  return productRows.map((row) => {
    const fallback = fallbackProducts.find((item) => item.slug === row.slug);
    const image = row.image_url || row.images?.[0] || fallback?.image || "";
    const stock = normalizeStock(
      stockRows.filter((item) => item.product_id === row.id),
    );
    const units = stock.reduce((sum, item) => sum + item.total, 0);
    const available = stock.reduce((sum, item) => sum + item.available, 0);
    const unlimitedStock = isUnlimitedStockProductSlug(row.slug);
    const productStatus =
      fallback?.productStatus === "sold_out" && row.active === false
        ? "sold_out"
        : row.active === false
          ? "hidden"
          : row.status === "draft" || row.status === "hidden"
            ? row.status
            : row.status === "sold_out" || (available <= 0 && !unlimitedStock)
              ? "sold_out"
              : "active";

    return {
      ...fallback,
      id: row.id,
      slug: row.slug,
      name: row.name,
      piece: row.drop_number || row.code || "CATÁLOGO",
      price: money(Number(row.price_mxn)),
      priceMxn: Number(row.price_mxn),
      color: row.color || fallback?.color || "Por confirmar",
      fit: row.fit || fallback?.fit || "Por confirmar",
      details: row.description || fallback?.details || "",
      status:
        productStatus === "sold_out"
          ? "COMING SOON"
          : unlimitedStock
            ? "BUY"
            : "PREORDER",
      productStatus,
      code: row.code || fallback?.code || row.slug,
      accent: row.accent || fallback?.accent || "black",
      image,
      images: row.images?.length ? row.images : [image],
      units: units || fallback?.units || 0,
      story: row.story || fallback?.story || "",
      drop: row.drop_number || "STORE",
      material: row.material || fallback?.material || "Por confirmar",
      printMethod: row.print_method || fallback?.printMethod || "Por confirmar",
      featured: Boolean(row.featured),
      unlimitedStock,
      stock:
        unlimitedStock && productStatus === "active"
          ? SIZES.map((size) => ({
              size,
              total: 20,
              reserved: 0,
              sold: 0,
              available: 20,
            }))
          : stock,
    };
  });
}

export async function getCatalogProducts(
  options: {
    includeHidden?: boolean;
    featuredOnly?: boolean;
    requireLive?: boolean;
  } = {},
) {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("products")
      .select(
        "id,slug,name,drop_number,price_mxn,image_url,images,active,status,description,color,fit,material,print_method,featured,story,code,accent",
      )
      .order("created_at", { ascending: true });

    if (options.featuredOnly) query = query.eq("featured", true);

    const { data: rows, error } = await query;
    if (error) throw error;
    if (!rows?.length) return [];

    const productIds = rows.map((row) => row.id);
    const { data: stockRows, error: stockError } = await supabase
      .from("product_stock")
      .select("product_id,size,total,reserved,sold")
      .in("product_id", productIds);

    if (stockError) throw stockError;
    const dbProducts = fromRows(
      rows as ProductRow[],
      (stockRows || []) as StockRow[],
    );
    const localCurrentDrop = fallbackProducts.filter(
      (product) =>
        product.drop.startsWith("004") &&
        !rows.some((row) => row.slug === product.slug),
    );
    return [...dbProducts, ...localCurrentDrop].filter(
      (product) =>
        (options.includeHidden ||
          ["active", "sold_out"].includes(product.productStatus)) &&
        (!options.featuredOnly || product.featured),
    );
  } catch {
    if (options.requireLive) return [];
    return options.featuredOnly
      ? fallbackProducts.filter((item) => item.featured)
      : fallbackProducts;
  }
}

export function getStockSummary(
  product: Pick<Product, "stock" | "productStatus" | "unlimitedStock">,
) {
  const total = product.stock.reduce((sum, item) => sum + item.total, 0);
  const reserved = product.stock.reduce((sum, item) => sum + item.reserved, 0);
  const sold = product.stock.reduce((sum, item) => sum + item.sold, 0);
  const available =
    product.productStatus === "sold_out"
      ? 0
      : product.stock.reduce((sum, item) => sum + item.available, 0);
  return {
    total,
    reserved,
    sold,
    available,
    unlimited: Boolean(product.unlimitedStock),
  };
}

export const getFomoLabel = availabilityLabel;

export const getPublicCatalog = cache(() => getCatalogProducts());
