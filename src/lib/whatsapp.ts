import { WHATSAPP_NUMBER } from "@/data/store";

export type WhatsappOrder = {
  orderCode: string;
  productName: string;
  size: string;
  quantity: number;
  totalMxn: number;
  customerName: string;
  customerEmail: string;
};

export function generateWhatsappMessage(order: WhatsappOrder) {
  return [
    "Hola OVRLMT, quiero confirmar mi preorder:",
    `Pedido: ${order.orderCode}`,
    `Producto: ${order.productName}`,
    `Talla: ${order.size}`,
    `Cantidad: ${order.quantity}`,
    `Total: $${order.totalMxn.toLocaleString("es-MX")} MXN`,
    `Nombre: ${order.customerName}`,
    `Correo: ${order.customerEmail}`,
    "Adjunto mi comprobante.",
  ].join("\n");
}

export function generateWhatsappUrl(order: WhatsappOrder) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(generateWhatsappMessage(order))}`;
}
