import type { ProductSize } from "@/data/store";

export type ProductStock = {
  size: ProductSize;
  total: number;
  reserved: number;
  sold: number;
  available: number;
};

export type ProductStatus = "draft" | "active" | "sold_out" | "hidden";

export type Product = {
  id?: string;
  slug: string;
  name: string;
  price: string;
  priceMxn: number;
  color: string;
  fit: string;
  details: string;
  status: "COMING SOON" | "PREORDER";
  productStatus: ProductStatus;
  code: string;
  accent: "black" | "bone" | "chrome";
  image: string;
  images: string[];
  units: number;
  piece: string;
  story: string;
  drop: string;
  material: string;
  printMethod: string;
  featured: boolean;
  unlimitedStock?: boolean;
  stock: ProductStock[];
};

const unlimitedStock: ProductStock[] = [
  { size: "CH", total: 999999, reserved: 0, sold: 0, available: 999999 },
  { size: "M", total: 999999, reserved: 0, sold: 0, available: 999999 },
  { size: "G", total: 999999, reserved: 0, sold: 0, available: 999999 },
  { size: "XG", total: 999999, reserved: 0, sold: 0, available: 999999 },
];

const soldOutStock: ProductStock[] = [
  { size: "CH", total: 1, reserved: 0, sold: 1, available: 0 },
  { size: "M", total: 2, reserved: 0, sold: 2, available: 0 },
  { size: "G", total: 2, reserved: 0, sold: 2, available: 0 },
  { size: "XG", total: 1, reserved: 0, sold: 1, available: 0 },
];

export const products: Product[] = [
  {
    slug: "after-limits-001",
    name: "After Limits",
    piece: "001",
    price: "$359 MXN",
    priceMxn: 359,
    color: "Negro",
    fit: "Premium fit",
    details: "Playera premium de edición limitada. Corte premium pensado para uso diario, con presencia limpia y estructura cómoda.",
    story: "Nace para quienes encuentran claridad después de medianoche: asfalto frío, luces rojas y la decisión de seguir cuando el límite deja de importar.",
    status: "COMING SOON",
    productStatus: "sold_out",
    code: "AD-001-A",
    accent: "black",
    units: 6,
    image: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_53_p.m._3_f1cqbm.png",
    images: ["https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_53_p.m._3_f1cqbm.png"],
    drop: "001",
    material: "100% algodón / 190 g/m2",
    printMethod: "DTF textil premium",
    featured: true,
    stock: soldOutStock,
  },
  {
    slug: "no-brakes-002",
    name: "No Brakes",
    piece: "002",
    price: "$359 MXN",
    priceMxn: 359,
    color: "Negro",
    fit: "Premium fit",
    details: "Playera premium de edición limitada. Corte premium pensado para uso diario, con presencia limpia y estructura cómoda.",
    story: "Una pieza construida alrededor del impulso: velocidad contenida, ciudad nocturna y la cultura de avanzar sin pedir permiso.",
    status: "COMING SOON",
    productStatus: "sold_out",
    code: "AD-001-B",
    accent: "bone",
    units: 6,
    image: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_50_p.m._1_to2kq4.png",
    images: ["https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_50_p.m._1_to2kq4.png"],
    drop: "001",
    material: "100% algodón / 190 g/m2",
    printMethod: "DTF textil premium",
    featured: true,
    stock: soldOutStock,
  },
  {
    slug: "zero-hour-003",
    name: "Zero Hour",
    piece: "003",
    price: "$359 MXN",
    priceMxn: 359,
    color: "Negro",
    fit: "Premium fit",
    details: "Playera premium de edición limitada. Corte premium pensado para uso diario, con presencia limpia y estructura cómoda.",
    story: "Zero Hour captura el instante en que la noche, el motor y la calle se alinean. Sin ruido extra. Solo dirección, tensión y movimiento.",
    status: "COMING SOON",
    productStatus: "sold_out",
    code: "AD-001-C",
    accent: "chrome",
    units: 6,
    image: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_51_p.m._2_l1isxe.png",
    images: ["https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_51_p.m._2_l1isxe.png"],
    drop: "001",
    material: "100% algodón / 190 g/m2",
    printMethod: "DTF textil premium",
    featured: true,
    stock: soldOutStock,
  },
  {
    slug: "naomi-cherry-blossom-gt3-hoodie",
    name: "Cherry Blossom × GT3 RS",
    piece: "NAYIOMI 01",
    price: "$459 MXN",
    priceMxn: 459,
    color: "Negro lavado",
    fit: "Corte regular",
    details: "Sudadera de edición especial con arte Nayiomi.ko, flor de cerezo y GT3 RS. Construida para una silueta cómoda, pesada y nocturna.",
    story: "El primer round mezcla precisión, velocidad y calma bajo presión. Cherry Blossom × GT3 RS convierte el movimiento de Nayiomi y la silueta del auto en una sola escena.",
    status: "PREORDER",
    productStatus: "active",
    code: "NY-004-01",
    accent: "black",
    units: 6,
    image: "/drops/naomi/cherry-blossom-gt3-hoodie.webp",
    images: ["/drops/naomi/cherry-blossom-gt3-hoodie.webp"],
    drop: "004 — NAYIOMI.KO",
    material: "French Terry heavyweight / 480 GSM",
    printMethod: "DTF textil de alta densidad",
    featured: true,
    unlimitedStock: true,
    stock: unlimitedStock,
  },
  {
    slug: "naomi-boxing-strike-tee",
    name: "Boxing Strike",
    piece: "NAYIOMI 02",
    price: "$359 MXN",
    priceMxn: 359,
    color: "Negro vintage",
    fit: "Corte regular",
    details: "Playera de edición especial con acabado negro vintage y gráfica Nayiomi.ko de boxeo, velocidad y flor de cerezo.",
    story: "Boxing Strike captura el golpe antes del impacto: una composición frontal, directa y contenida donde Nayiomi domina el cuadro y la velocidad permanece debajo.",
    status: "PREORDER",
    productStatus: "active",
    code: "NY-004-02",
    accent: "black",
    units: 6,
    image: "/drops/naomi/boxing-strike-tee.webp",
    images: ["/drops/naomi/boxing-strike-tee.webp"],
    drop: "004 — NAYIOMI.KO",
    material: "Algodón heavyweight wash / 260 GSM",
    printMethod: "DTF textil de alta densidad",
    featured: true,
    unlimitedStock: true,
    stock: unlimitedStock,
  },
  {
    slug: "naomi-title-champion-hoodie",
    name: "Title Champion",
    piece: "NAYIOMI 03",
    price: "$459 MXN",
    priceMxn: 459,
    color: "Negro lavado",
    fit: "Corte regular",
    details: "Sudadera de edición especial con gráfica Title Champion de Nayiomi.ko, flores de cerezo y composición vertical de gran formato.",
    story: "La pieza final del drop lleva el nombre al frente y el título completo en la espalda. Es el cierre del combate: disciplina, presencia y una imagen hecha para dominar la noche.",
    status: "PREORDER",
    productStatus: "active",
    code: "NY-004-03",
    accent: "black",
    units: 6,
    image: "/drops/naomi/title-champion-hoodie.webp",
    images: ["/drops/naomi/title-champion-hoodie.webp"],
    drop: "004 — NAYIOMI.KO",
    material: "French Terry heavyweight / 480 GSM",
    printMethod: "DTF textil de alta densidad",
    featured: true,
    unlimitedStock: true,
    stock: unlimitedStock,
  },
];
