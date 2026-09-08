"use client";
import Image from "next/image";
import { useState } from "react";
import { Modal } from "./Modal";
export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const unique = Array.from(new Set(images));
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState(false);
  return (
    <section className="product-gallery" aria-label={`Imágenes de ${name}`}>
      <button
        className="product-detail-image gallery-main"
        onClick={() => setZoom(true)}
        aria-label={`Ampliar imagen de ${name}`}
      >
        <Image
          src={unique[selected]}
          alt={`${name} — vista ${selected + 1}`}
          fill
          priority
          sizes="(max-width: 900px) 100vw, 55vw"
        />
        <span>AMPLIAR ↗</span>
      </button>
      {unique.length > 1 && (
        <div className="gallery-thumbnails">
          {unique.map((src, i) => (
            <button
              key={src}
              aria-label={`Ver imagen ${i + 1}`}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <Image
                src={src}
                alt={`${name} — miniatura ${i + 1}`}
                fill
                sizes="96px"
              />
            </button>
          ))}
        </div>
      )}
      <p className="visual-reference">
        Referencia visual del diseño. Mostramos únicamente las imágenes
        disponibles de esta pieza.
      </p>
      {zoom && (
        <Modal title={name} onClose={() => setZoom(false)}>
          <div className="gallery-zoom">
            <Image
              src={unique[selected]}
              alt={`${name} ampliada`}
              fill
              sizes="90vw"
            />
          </div>
        </Modal>
      )}
    </section>
  );
}
