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
  { slug: "playera-01", name: "PLAYERA 01", price: "$359 MXN", color: "NEGRO", fit: "OVERSIZED", details: "Playera unisex de corte oversized con gráfico exclusivo OVRLMT. Diseñada para una caída amplia y cómoda, forma parte de una edición limitada de solo seis piezas.", status: "PREORDER", code: "AD-001-A", accent: "black", units: 6, image: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782136931/ChatGPT_Image_22_jun_2026_08_02_01_a.m._g54uze.png" },
  { slug: "playera-02", name: "PLAYERA 02", price: "$359 MXN", color: "NEGRO", fit: "OVERSIZED", details: "Playera unisex de corte oversized con composición gráfica del DROP 001. Una pieza de uso diario producida en una corrida privada de solo seis unidades.", status: "PREORDER", code: "AD-001-B", accent: "bone", units: 6, image: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782136931/ChatGPT_Image_22_jun_2026_08_01_34_a.m._kucm35.png" },
  { slug: "playera-03", name: "PLAYERA 03", price: "$359 MXN", color: "NEGRO", fit: "OVERSIZED", details: "Playera unisex oversized con identidad visual OVRLMT y acabado urbano. Disponible únicamente durante el DROP 001 en una edición de seis piezas.", status: "PREORDER", code: "AD-001-C", accent: "chrome", units: 6, image: "https://res.cloudinary.com/dakjhsfne/image/upload/v1782136931/ChatGPT_Image_22_jun_2026_08_01_45_a.m._edrxv3.png" },
];
