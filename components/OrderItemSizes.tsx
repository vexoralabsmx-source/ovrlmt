import { Fragment } from "react";

export type OrderSizeItem = { name: string; size: string; quantity: number };

export function OrderItemSizes({ items, size, quantity }: {
  items?: OrderSizeItem[] | null;
  size: string;
  quantity: number;
}) {
  if (!items?.length) {
    return <>{quantity}x / {size === "MULTI" ? "TALLAS NO DISPONIBLES" : `TALLA ${size}`}</>;
  }

  return <>{items.map((item, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      {item.quantity}x {item.name} / TALLA {item.size}
    </Fragment>
  ))}</>;
}
