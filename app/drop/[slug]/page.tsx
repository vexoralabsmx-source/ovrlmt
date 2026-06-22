import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/PageFrame";
import { ProductPurchase } from "@/components/ProductPurchase";
import { products } from "@/data/products";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  return product ? { title: product.name, description: product.details } : {};
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  return <PageFrame>
    <main className="product-page">
      <div className="product-breadcrumb"><Link href="/drop">← VOLVER AL DROP</Link><span>{product.code}</span></div>
      <div className="product-detail">
        <section className="product-detail-image"><Image src={product.image} alt={`${product.name} OVRLMT`} fill priority sizes="(max-width: 900px) 100vw, 58vw" /></section>
        <section className="product-detail-info">
          <p className="product-status"><i /> {product.status} / DROP 001</p>
          <h1>{product.name}</h1>
          <p className="product-price">{product.price}</p>
          <p className="product-description">{product.details}</p>
          <dl className="product-specs">
            <div><dt>COLOR</dt><dd>{product.color}</dd></div>
            <div><dt>FIT</dt><dd>{product.fit}</dd></div>
            <div><dt>EDICIÓN</dt><dd>{product.units} PIEZAS</dd></div>
            <div><dt>GÉNERO</dt><dd>UNISEX</dd></div>
          </dl>
          <ProductPurchase product={product} />
        </section>
      </div>
    </main>
  </PageFrame>;
}
