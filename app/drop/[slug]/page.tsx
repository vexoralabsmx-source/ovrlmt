import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/PageFrame";
import { ProductPurchase } from "@/components/ProductPurchase";
import { products } from "@/data/products";
import { LOCAL_DELIVERY_COPY, PRODUCT_MATERIAL } from "@/data/store";
import { FaqSection, TrustSection } from "@/components/CommerceSections";
import { getCatalogProducts, getFomoLabel, getStockSummary } from "@/src/lib/catalog";
import { ProductReviews } from "@/components/ProductReviews";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getCatalogProducts();
  const product = catalog.find((item) => item.slug === slug) || products.find((item) => item.slug === slug);
  return product ? { title: `${product.name} ${product.piece}`, description: product.details, alternates: { canonical: `/drop/${product.slug}` } } : {};
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const catalog = await getCatalogProducts();
  const product = catalog.find((item) => item.slug === slug);
  if (!product) notFound();
  const stockSummary = getStockSummary(product);
  const usesOptimizedLocalAsset = product.image.startsWith("/drops/naomi/");

  return <PageFrame>
    <main className="product-page">
      <div className="product-breadcrumb"><Link href="/drop">← VOLVER AL DROP</Link><span>{product.code}</span></div>
      <div className="product-detail">
        <section className="product-gallery"><div className="product-detail-image"><Image src={product.image} alt={`${product.name}, pieza ${product.piece} de OVRLMT`} fill priority unoptimized={usesOptimizedLocalAsset} sizes="(max-width: 900px) 100vw, 58vw" /></div><div className="product-gallery-rail"><div><Image src={product.image} alt={`Detalle frontal de ${product.name}`} fill unoptimized={usesOptimizedLocalAsset} sizes="240px" /></div><div><Image src={product.image} alt={`Detalle de impresión de ${product.name}`} fill unoptimized={usesOptimizedLocalAsset} sizes="240px" /></div></div></section>
        <section className="product-detail-info">
          <p className="product-status"><i /> {product.unlimitedStock ? "VENTA OFICIAL / COMPRA ABIERTA" : "SOBRE PEDIDO"} / {getFomoLabel(stockSummary.available, stockSummary.unlimited)}</p>
          <p className="piece-number">PIEZA {product.piece}</p><h1>{product.name}</h1>
          <p className="product-price">{product.price}</p>
          <p className="product-description">{product.details}</p>
          <p className="visual-reference">Producto sobre pedido. El mockup es una referencia visual y la prenda física final puede tener ligeras variaciones de producción.</p>
          <div className="technical-details"><p className="section-label">DETALLES TÉCNICOS</p><dl className="product-specs"><div><dt>COLOR</dt><dd>{product.color}</dd></div><div><dt>FIT</dt><dd>{product.fit}</dd></div><div><dt>MATERIAL</dt><dd>{product.material || PRODUCT_MATERIAL}</dd></div><div><dt>IMPRESIÓN</dt><dd>{product.printMethod}</dd></div><div><dt>EDICIÓN</dt><dd>{product.unlimitedStock ? "Drop abierto" : `${product.units} cupos por diseño`}</dd></div><div><dt>DISPONIBILIDAD</dt><dd>{product.unlimitedStock ? "Stock ilimitado" : `${stockSummary.available} cupos`}</dd></div><div className="wide"><dt>PRODUCCIÓN</dt><dd>Sobre pedido, después de confirmar el pago</dd></div><div className="wide"><dt>ENTREGA LOCAL</dt><dd>{LOCAL_DELIVERY_COPY}</dd></div><div className="wide"><dt>USO RECOMENDADO</dt><dd>Outfit urbano, nocturno, casual y motorsport inspired</dd></div><div className="wide"><dt>CUIDADOS</dt><dd>Lavar al revés, agua fría, no usar cloro, no planchar sobre el estampado</dd></div></dl></div>
          <div className="product-commerce-notes">
            <article><span>FIT</span><p>Corte premium regular. Si prefieres usarla más amplia, considera una talla arriba.</p></article>
            <article><span>TALLAS</span><p>CH, M, G y XL. Revisa la guía de tallas antes de confirmar tu pago.</p></article>
            <article><span>SOBRE PEDIDO</span><p>Tu pieza entra a producción al validar el pago y el comprobante por WhatsApp.</p></article>
            <article><span>CAMBIOS</span><p>No hay cambios por error de talla después de confirmar la compra. Sí se revisan defectos de producción.</p></article>
          </div>
          <ProductPurchase product={product} />
        </section>
      </div>
      <section className="piece-story"><p className="section-label">DESIGN FILE / {product.piece}</p><h2>POR QUÉ ESTA<br />PIEZA EXISTE</h2><p>{product.story}</p></section>
    </main>
    <ProductReviews productSlug={product.slug} />
    <TrustSection />
    <FaqSection />
  </PageFrame>;
}
