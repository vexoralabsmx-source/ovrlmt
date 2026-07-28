import "server-only";
import { products as fallbackProducts, type Product, type ProductStock, type ProductStatus } from "@/data/products";
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

function money(value: number) {
  return `$${Number(value).toLocaleString("es-MX")} MXN`;
}

function normalizeStock(rows: StockRow[]) {
  return SIZES.map((size) => {
    const row = rows.find((item) => item.size === size);
    const total = Number(row?.total || 0);
    const reserved = Number(row?.reserved || 0);
    const sold = Number(row?.sold || 0);
    return { size, total, reserved, sold, available: Math.max(0, total - reserved - sold) };
  });
}

function fromRows(productRows: ProductRow[], stockRows: StockRow[]): Product[] {
  return productRows.map((row, index) => {
    const fallback = fallbackProducts.find((item) => item.slug === row.slug) || fallbackProducts[index % fallbackProducts.length];
    const image = row.image_url || row.images?.[0] || fallback.image;
    const stock = normalizeStock(stockRows.filter((item) => item.product_id === row.id));
    const units = stock.reduce((sum, item) => sum + item.total, 0);
    const available = stock.reduce((sum, item) => sum + item.available, 0);
    const productStatus = row.status || (row.active === false ? "hidden" : available <= 0 ? "sold_out" : "active");

    return {
      ...fallback,
      id: row.id,
      slug: row.slug,
      name: row.name,
      piece: row.drop_number || fallback.piece,
      price: money(Number(row.price_mxn)),
      priceMxn: Number(row.price_mxn),
      color: row.color || fallback.color,
      fit: row.fit || fallback.fit,
      details: row.description || fallback.details,
      status: productStatus === "sold_out" ? "COMING SOON" : "PREORDER",
      productStatus,
      code: row.code || fallback.code,
      accent: row.accent || fallback.accent,
      image,
      images: row.images?.length ? row.images : [image],
      units: units || fallback.units,
      story: row.story || fallback.story,
      drop: row.drop_number || fallback.drop,
      material: row.material || fallback.material,
      printMethod: row.print_method || fallback.printMethod,
      featured: Boolean(row.featured),
      stock: stock.some((item) => item.total > 0) ? stock : fallback.stock,
    };
  });
}

export async function getCatalogProducts(options: { includeHidden?: boolean; featuredOnly?: boolean } = {}) {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("products")
      .select("id,slug,name,drop_number,price_mxn,image_url,images,active,status,description,color,fit,material,print_method,featured,story,code,accent")
      .order("created_at", { ascending: true });

    if (!options.includeHidden) query = query.in("status", ["active", "sold_out"]).eq("active", true);
    if (options.featuredOnly) query = query.eq("featured", true);

    const { data: rows, error } = await query;
    if (error || !rows?.length) return options.featuredOnly ? fallbackProducts.filter((item) => item.featured) : fallbackProducts;

    const productIds = rows.map((row) => row.id);
    const { data: stockRows } = await supabase
      .from("product_stock")
      .select("product_id,size,total,reserved,sold")
      .in("product_id", productIds);

    return fromRows(rows as ProductRow[], (stockRows || []) as StockRow[]);
  } catch {
    return options.featuredOnly ? fallbackProducts.filter((item) => item.featured) : fallbackProducts;
  }
}

export function getStockSummary(product: Pick<Product, "stock" | "productStatus">) {
  const total = product.stock.reduce((sum, item) => sum + item.total, 0);
  const reserved = product.stock.reduce((sum, item) => sum + item.reserved, 0);
  const sold = product.stock.reduce((sum, item) => sum + item.sold, 0);
  const available = product.productStatus === "sold_out" ? 0 : product.stock.reduce((sum, item) => sum + item.available, 0);
  return { total, reserved, sold, available };
}

export function getFomoLabel(available: number) {
  if (available <= 0) return "Agotado";
  if (available === 1) return "Último cupo";
  if (available === 2) return "Solo quedan 2 cupos";
  if (available <= 4) return "Pocos cupos";
  return `${available} cupos`;
}
