export type Product = {
  slug: string;
  name: string;
  price: string;
  color: string;
  fit: string;
  details: string;
  status: "COMING SOON" | "PREORDER";
  code: string;
  accent: "black" | "bone" | "chrome";
  image: string;
  units: number;
};

export const products: Product[] = [
  { slug: "after-limits-001", name: "After Limits 001", price: "$359 MXN", color: "NEGRO", fit: "OVERSIZED", details: "Playera unisex de corte oversized con gráfico exclusivo OVRLMT. Diseñada para una caída amplia y cómoda, forma parte de una edición limitada de solo seis piezas.", status: "PREORDER", code: "AD-001-A", accent: "black", units: 6, image: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_53_p.m._3_f1cqbm.png" },
  { slug: "no-brakes-002", name: "No Brakes 002", price: "$359 MXN", color: "NEGRO", fit: "OVERSIZED", details: "Playera unisex de corte oversized con composición gráfica del DROP 001. Una pieza de uso diario producida en una corrida privada de solo seis unidades.", status: "PREORDER", code: "AD-001-B", accent: "bone", units: 6, image: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_50_p.m._1_to2kq4.png" },
  { slug: "zero-hour-003", name: "Zero Hour 003", price: "$359 MXN", color: "NEGRO", fit: "OVERSIZED", details: "Playera unisex oversized con identidad visual OVRLMT y acabado urbano. Disponible únicamente durante el DROP 001 en una edición de seis piezas.", status: "PREORDER", code: "AD-001-C", accent: "chrome", units: 6, image: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_51_p.m._2_l1isxe.png" },
];
