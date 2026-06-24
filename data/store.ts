export const PRODUCT_PRICE = 359;
export const SHIPPING_COST = 150;
export const FREE_SHIPPING_MINIMUM = 1500;
export const WHATSAPP_NUMBER = "522212693309";
export const BANK_NAME = "BBVA";
export const ACCOUNT_NAME = "Miguel Ángel Dorantes Hernández";
export const BANK_CARD = "4152 3146 1191 9765";

export const SIZES = ["CH", "M", "G", "XL"] as const;
export type ProductSize = (typeof SIZES)[number];
