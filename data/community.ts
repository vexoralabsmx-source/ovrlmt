import type { ProductSize } from "./store";
export type CommunityPhoto = {
  image: string;
  alt: string;
  caption: string;
  productSlug: string;
  heightCm?: number;
  size?: ProductSize;
  fit?: string;
};
// Agregar únicamente fotografías reales con autorización de publicación.
export const communityPhotos: CommunityPhoto[] = [];
