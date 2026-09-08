import type { Metadata } from "next";
import { ProductGallery } from "@/components/ProductGallery";
import { internalProductSlug, publicProductSlug, productUrl, garmentType, POLICIES } from "@/data/commerce";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/PageFrame";
import { ProductPurchase } from "@/components/ProductPurchase";
import { products } from "@/data/products";
import { LOCAL_DELIVERY_COPY, PRODUCT_MATERIAL } from "@/data/store";
import { FaqSection, TrustSection } from "@/components/CommerceSections";
import { getPublicCatalog, getFomoLabel, getStockSummary } from "@/src/lib/catalog";
import { ProductReviews } from "@/components/ProductReviews";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug: publicProductSlug(slug) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getPublicCatalog();
  const product = catalog.find((item) => item.slug === internalProductSlug(slug)) || products.find((item) => item.slug === internalProductSlug(slug));
  return product ? { title: product.name, description: product.details, alternates: { canonical: productUrl(product.slug) }, openGraph: { title: product.name, description: product.details, url: productUrl(product.slug), images: [{ url: product.image, alt: product.name }] }, twitter: { card: "summary_large_image", title: product.name, description: product.details, images: [product.image] } } : {};
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const catalog = await getPublicCatalog();
  const product = catalog.find((item) => item.slug === internalProductSlug(slug));
  if (!product) notFound();
  const stockSummary = getStockSummary(product);


  const structuredData = { "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.details, image: product.images.map(image => new URL(image, "https://ovrlmt.xyz").href), sku: product.code, brand: { "@type": "Brand", name: "OVRLMT" }, offers: { "@type": "Offer", url: `https://ovrlmt.xyz${productUrl(product.slug)}`, priceCurrency: "MXN", price: product.priceMxn, availability: stockSummary.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } };
  return <PageFrame>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <div className="product-page">
      <div className="product-breadcrumb"><Link href="/drop">← VOLVER AL DROP</Link><span>{product.code}</span></div>
      <div className="product-detail">
        <ProductGallery images={product.images.length ? product.images : [product.image]} name={product.name} />
        <section className="product-detail-info">
          <p className="product-status"><i /> {getFomoLabel(stockSummary.available, stockSummary.unlimited)}</p>
          <p className="piece-number">{garmentType(product)} / {product.code}</p><h1>{product.name}</h1>
          <p className="product-price">{product.price}</p>
          <p className="product-description">{product.details}</p>
          <p className="visual-reference">Producto sobre pedido. El mockup es una referencia visual y la prenda física final puede tener ligeras variaciones de producción.</p>
          <ProductPurchase product={product} />
          <div className="technical-details"><p className="section-label">DETALLES TÉCNICOS</p><dl className="product-specs"><div><dt>COLOR</dt><dd>{product.color}</dd></div><div><dt>FIT</dt><dd>{product.fit}</dd></div><div><dt>MATERIAL</dt><dd>{product.material || PRODUCT_MATERIAL}</dd></div><div><dt>IMPRESIÓN</dt><dd>{product.printMethod}</dd></div><div><dt>EDICIÓN</dt><dd>{product.unlimitedStock ? "Drop abierto" : `${product.units} cupos por diseño`}</dd></div><div><dt>DISPONIBILIDAD</dt><dd>{getFomoLabel(stockSummary.available, stockSummary.unlimited)}</dd></div><div className="wide"><dt>PRODUCCIÓN</dt><dd>Sobre pedido, después de confirmar el pago</dd></div><div className="wide"><dt>ENTREGA LOCAL</dt><dd>{LOCAL_DELIVERY_COPY}</dd></div><div className="wide"><dt>USO RECOMENDADO</dt><dd>Outfit urbano, nocturno, casual y motorsport inspired</dd></div><div className="wide"><dt>CUIDADOS</dt><dd>Lavar al revés, agua fría, no usar cloro, no planchar sobre el estampado</dd></div></dl></div>
          <div className="product-commerce-notes">
            <article><span>FIT</span><p>{product.fit}. Confirma las medidas de este modelo antes de elegir talla.</p></article>
            <article><span>TALLAS</span><p>CH, M, G y XG. Revisa la guía de tallas antes de confirmar tu pago.</p></article>
            <article><span>SOBRE PEDIDO</span><p>{POLICIES.payment}</p></article>
            <article><span>CAMBIOS</span><p>{POLICIES.sizes}</p></article>
          </div>

        </section>
      </div>
      <section className="piece-story"><p className="section-label">DESIGN FILE / {product.piece}</p><h2>POR QUÉ ESTA<br />PIEZA EXISTE</h2><p>{product.story}</p></section>
    </div>
    <ProductReviews productSlug={product.slug} />
    <TrustSection />
    <FaqSection />
  </PageFrame>;
}
