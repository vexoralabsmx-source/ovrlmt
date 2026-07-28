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
  stock: ProductStock[];
};

const baseStock: ProductStock[] = [
  { size: "CH", total: 1, reserved: 0, sold: 0, available: 1 },
  { size: "M", total: 2, reserved: 0, sold: 0, available: 2 },
  { size: "G", total: 2, reserved: 0, sold: 0, available: 2 },
  { size: "XG", total: 1, reserved: 0, sold: 0, available: 1 },
];

export const products: Product[] = [
  { slug: "after-limits-001", name: "After Limits", piece: "001", price: "$359 MXN", priceMxn: 359, color: "Negro", fit: "Premium fit", details: "Playera premium de edición limitada. Corte premium pensado para uso diario, con presencia limpia y estructura cómoda.", story: "Nace para quienes encuentran claridad después de medianoche: asfalto frío, luces rojas y la decisión de seguir cuando el límite deja de importar.", status: "PREORDER", productStatus: "active", code: "AD-001-A", accent: "black", units: 6, image: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_53_p.m._3_f1cqbm.png", images: ["https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_53_p.m._3_f1cqbm.png"], drop: "001", material: "100% algodón / 190 g/m2", printMethod: "DTF textil premium", featured: true, stock: baseStock },
  { slug: "no-brakes-002", name: "No Brakes", piece: "002", price: "$359 MXN", priceMxn: 359, color: "Negro", fit: "Premium fit", details: "Playera premium de edición limitada. Corte premium pensado para uso diario, con presencia limpia y estructura cómoda.", story: "Una pieza construida alrededor del impulso: velocidad contenida, ciudad nocturna y la cultura de avanzar sin pedir permiso.", status: "PREORDER", productStatus: "active", code: "AD-001-B", accent: "bone", units: 6, image: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_50_p.m._1_to2kq4.png", images: ["https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_50_p.m._1_to2kq4.png"], drop: "001", material: "100% algodón / 190 g/m2", printMethod: "DTF textil premium", featured: true, stock: baseStock },
  { slug: "zero-hour-003", name: "Zero Hour", piece: "003", price: "$359 MXN", priceMxn: 359, color: "Negro", fit: "Premium fit", details: "Playera premium de edición limitada. Corte premium pensado para uso diario, con presencia limpia y estructura cómoda.", story: "Zero Hour captura el instante en que la noche, el motor y la calle se alinean. Sin ruido extra. Solo dirección, tensión y movimiento.", status: "PREORDER", productStatus: "active", code: "AD-001-C", accent: "chrome", units: 6, image: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_51_p.m._2_l1isxe.png", images: ["https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_51_p.m._2_l1isxe.png"], drop: "001", material: "100% algodón / 190 g/m2", printMethod: "DTF textil premium", featured: true, stock: baseStock },
];
