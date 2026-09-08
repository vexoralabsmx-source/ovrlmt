import Link from "next/link";
import { PageFrame } from "@/components/PageFrame";
import { ProductCard } from "@/components/ProductCard";
import { getCatalogProducts } from "@/src/lib/catalog";
import { garmentType, isCurrentDrop } from "@/data/commerce";
export const metadata = {
  title: "Tienda",
  description:
    "Explora Drop 004, playeras, sudaderas y el archivo OVRLMT. Streetwear producido en Puebla.",
  alternates: { canonical: "/drop" },
};
export const dynamic = "force-dynamic";
const categories = [
  ["todas", "TODAS"],
  ["actual", "DROP ACTUAL"],
  ["playeras", "PLAYERAS"],
  ["sudaderas", "SUDADERAS"],
  ["colaboraciones", "COLABORACIONES"],
  ["archivo", "ARCHIVO"],
] as const;
export default async function Drop({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const category = categories.some(([key]) => key === params.categoria)
    ? params.categoria!
    : "todas";
  const catalog = await getCatalogProducts();
  const products = catalog
    .filter((p) =>
      category === "archivo"
        ? p.productStatus === "sold_out"
        : p.productStatus === "active",
    )
    .filter((p) =>
      category === "actual" || category === "colaboraciones"
        ? isCurrentDrop(p)
        : category === "playeras"
          ? garmentType(p) === "Playera"
          : category === "sudaderas"
            ? garmentType(p) === "Sudadera"
            : true,
    )
    .sort((a, b) => Number(isCurrentDrop(b)) - Number(isCurrentDrop(a)));
  const pages = Math.max(1, Math.ceil(products.length / 6));
  const page = Math.min(
    pages,
    Math.max(1, Math.floor(Number(params.pagina)) || 1),
  );
  return (
    <PageFrame>
      <section className="page-hero drop-hero">
        <div className="page-index">STORE</div>
        <p className="eyebrow">MADE TO ORDER / PUEBLA MX</p>
        <h1>
          {category === "archivo" ? "ARCHIVO" : "OVRLMT STORE"}
          <span>
            {category === "actual"
              ? "DROP 004 / NAYIOMI.KO × OVRLMT"
              : categories.find(([key]) => key === category)?.[1]}
          </span>
        </h1>
        <div className="page-intro">
          <p>
            Negro, gráfica y carácter.
            <br />
            Construido después de medianoche.
          </p>
        </div>
      </section>
      <section className="drop-list section-pad">
        <nav className="catalog-filters" aria-label="Categorías">
          {categories.map(([key, label]) => (
            <Link
              key={key}
              href={`/drop?categoria=${key}`}
              aria-current={category === key ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="catalog-count">
          {products.length} piezas
          {category === "archivo"
            ? " · Colecciones anteriores, sin compra disponible"
            : ""}
        </p>
        <div className="product-grid">
          {products.slice((page - 1) * 6, page * 6).map((product, index) => (
            <ProductCard
              key={product.slug}
              product={product}
              index={(page - 1) * 6 + index}
            />
          ))}
        </div>
        {!products.length && (
          <p className="reviews-empty">
            No hay piezas disponibles en esta categoría.
          </p>
        )}
        {pages > 1 && (
          <nav className="catalog-filters" aria-label="Páginas">
            {Array.from({ length: pages }, (_, i) => (
              <Link
                aria-current={page === i + 1 ? "page" : undefined}
                key={i}
                href={`/drop?categoria=${category}&pagina=${i + 1}`}
              >
                {i + 1}
              </Link>
            ))}
          </nav>
        )}
      </section>
    </PageFrame>
  );
}
