import "server-only";
import { Resend } from "resend";
import { getOrderStatusLabel } from "@/src/lib/orderStatus";

export type EmailOrder = {
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  productName: string;
  size: string;
  quantity: number;
  subtotalMxn: number;
  discountMxn: number;
  shippingMxn: number;
  totalMxn: number;
  discountCode?: string | null;
  status: string;
  addressCity?: string | null;
  addressState?: string | null;
  notes?: string | null;
};

export type EmailResult = {
  ok: boolean;
  id?: string;
  errorMessage?: string;
  statusCode?: number;
};

function getRequiredEnv(name: "RESEND_API_KEY" | "RESEND_FROM_EMAIL" | "ADMIN_NOTIFICATION_EMAIL") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function getFromEmail() {
  const value = getRequiredEnv("RESEND_FROM_EMAIL").trim();
  const markdownMailto = value.match(/^(.+?)\s+\[([^\]]+)\]\(mailto:[^)]+\)$/i);
  if (markdownMailto) return `${markdownMailto[1].trim()} <${markdownMailto[2].trim()}>`;
  return value;
}

function getResend() {
  return new Resend(getRequiredEnv("RESEND_API_KEY"));
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("es-MX")} MXN`;
}

const BRAND_LOGO_URL = "https://res.cloudinary.com/dakjhsfne/image/upload/v1782122080/image-Photoroom_ymoals.png";
const BRAND_FAVICON_URL = "https://res.cloudinary.com/dakjhsfne/image/upload/v1782122079/image-Photoroom_1_a8uhzj.png";
const SITE_URL = "https://ovrlmt.xyz";
const CONTACT_EMAIL = "contacto@ovrlmt.xyz";
const INSTAGRAM_URL = "https://www.instagram.com/ovrlmt.mx";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseEmailError(error: unknown): Pick<EmailResult, "errorMessage" | "statusCode"> {
  if (error instanceof Error) return { errorMessage: error.message };
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      errorMessage: typeof record.message === "string" ? record.message : "Resend email failed.",
      statusCode: typeof record.statusCode === "number" ? record.statusCode : undefined,
    };
  }
  return { errorMessage: "Resend email failed." };
}

function detailRow(label: string, value: unknown, options?: { strong?: boolean }) {
  const safeValue = typeof value === "number" ? value : escapeHtml(value);
  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #232323;color:#777;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${label}</td>
      <td align="right" style="padding:14px 0;border-bottom:1px solid #232323;color:${options?.strong ? "#c1121f" : "#f3f0ea"};font-size:${options?.strong ? "18px" : "13px"};font-weight:${options?.strong ? "800" : "700"};letter-spacing:.02em;">${safeValue}</td>
    </tr>
  `;
}

function emailLayout({
  preheader,
  badge,
  title,
  intro,
  orderCode,
  children,
}: {
  preheader: string;
  badge: string;
  title: string;
  intro: string;
  orderCode: string;
  children: string;
}) {
  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background:#050505;color:#f3f0ea;font-family:Arial,Helvetica,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
          <tr>
            <td align="center" style="padding:28px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:680px;border:1px solid #242424;background:#080808;">
                <tr>
                  <td style="height:6px;background:#c1121f;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:28px 28px 18px;border-bottom:1px solid #1f1f1f;background:#050505;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left">
                          <img src="${BRAND_LOGO_URL}" width="152" alt="OVRLMT" style="display:block;width:152px;max-width:55%;height:auto;border:0;" />
                        </td>
                        <td align="right" style="color:#777;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;">
                          ${escapeHtml(orderCode)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:38px 28px 12px;background:radial-gradient(circle at 82% 18%,#2b0307 0,#080808 36%,#080808 100%);">
                    <p style="margin:0 0 18px;color:#c1121f;font-size:10px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;">
                      ${escapeHtml(badge)}
                    </p>
                    <h1 style="margin:0;color:#f3f0ea;font-size:44px;line-height:.88;font-weight:800;letter-spacing:-.06em;">
                      ${escapeHtml(title)}
                    </h1>
                    <p style="max-width:520px;margin:22px 0 0;color:#a7a7a7;font-size:14px;line-height:1.75;">
                      ${escapeHtml(intro)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 28px 34px;">
                    ${children}
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 28px;border-top:1px solid #1f1f1f;background:#050505;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <img src="${BRAND_FAVICON_URL}" width="30" alt="" style="display:block;width:30px;height:auto;border:0;" />
                        </td>
                        <td align="right" style="color:#777;font-size:10px;line-height:1.8;letter-spacing:.08em;">
                          <a href="${SITE_URL}" style="color:#f3f0ea;text-decoration:none;">OVRLMT.XYZ</a><br />
                          <a href="${INSTAGRAM_URL}" style="color:#777;text-decoration:none;">@OVRLMT.MX</a> / <a href="mailto:${CONTACT_EMAIL}" style="color:#777;text-decoration:none;">${CONTACT_EMAIL}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function orderSummaryTable(order: EmailOrder, includeCustomerDetails = false) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
      ${includeCustomerDetails ? detailRow("Cliente", order.customerName) : ""}
      ${includeCustomerDetails ? detailRow("Email", order.customerEmail) : ""}
      ${includeCustomerDetails ? detailRow("WhatsApp", order.customerWhatsapp) : ""}
      ${detailRow("Producto", order.productName)}
      ${detailRow("Talla", order.size)}
      ${detailRow("Cantidad", order.quantity)}
      ${detailRow("Subtotal", formatMoney(order.subtotalMxn))}
      ${detailRow("Descuento", formatMoney(order.discountMxn))}
      ${detailRow("Envio", formatMoney(order.shippingMxn))}
      ${detailRow("Total", formatMoney(order.totalMxn), { strong: true })}
    </table>
  `;
}

export async function sendCustomerPreorderEmail(order: EmailOrder): Promise<EmailResult> {
  try {
    const result = await getResend().emails.send({
      from: getFromEmail(),
      to: [order.customerEmail],
      subject: `Tu pedido OVRLMT fue registrado - ${order.orderCode}`,
      html: emailLayout({
        preheader: `Pedido ${order.orderCode} registrado. Envia tu comprobante para confirmar.`,
        badge: "Pedido registrado",
        title: "Tu apartado esta en linea.",
        intro: "Gracias por apartar OVRLMT. Guardamos tu pedido y te dejamos el resumen para que puedas confirmar el pago por WhatsApp.",
        orderCode: order.orderCode,
        children: `
          <div style="padding:20px;border:1px solid #242424;background:#0b0b0b;">
            <p style="margin:0 0 16px;color:#777;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;">Resumen del pedido</p>
            ${orderSummaryTable(order)}
          </div>
          <div style="margin-top:14px;padding:20px;border:1px solid #2d1517;background:#130609;">
            <p style="margin:0;color:#f3f0ea;font-size:14px;line-height:1.7;">
              Para confirmar tu pedido, envia tu comprobante por WhatsApp. Tu pedido queda confirmado cuando recibamos y validemos el comprobante.
            </p>
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">
            <tr>
              <td>
                <a href="${INSTAGRAM_URL}" style="display:inline-block;padding:15px 18px;background:#f3f0ea;color:#050505;text-decoration:none;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">Instagram</a>
                <a href="mailto:${CONTACT_EMAIL}" style="display:inline-block;margin-left:8px;padding:14px 17px;border:1px solid #3a3a3a;color:#f3f0ea;text-decoration:none;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">Contacto</a>
              </td>
            </tr>
          </table>
        `,
      }),
    });

    if (result.error) return { ok: false, errorMessage: result.error.message };
    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, ...parseEmailError(error) };
  }
}

export async function sendAdminPreorderNotification(order: EmailOrder): Promise<EmailResult> {
  const adminEmail = getRequiredEnv("ADMIN_NOTIFICATION_EMAIL");

  try {
    const result = await getResend().emails.send({
      from: getFromEmail(),
      to: [adminEmail],
      subject: `Nuevo pedido OVRLMT - ${order.orderCode}`,
      html: emailLayout({
        preheader: `Nuevo pedido ${order.orderCode} por ${order.customerName}.`,
        badge: "Nuevo preorder",
        title: "Nuevo pedido registrado.",
        intro: "Se registro un pedido desde la web. Estos son los datos para seguimiento, validacion de pago y envio.",
        orderCode: order.orderCode,
        children: `
          <div style="padding:20px;border:1px solid #242424;background:#0b0b0b;">
            <p style="margin:0 0 16px;color:#777;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;">Detalle interno</p>
            ${orderSummaryTable(order, true)}
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              ${detailRow("Cupon", order.discountCode || "Sin cupon")}
              ${detailRow("Status", order.status)}
              ${detailRow("Ciudad", order.addressCity || "N/A")}
              ${detailRow("Estado", order.addressState || "N/A")}
            </table>
          </div>
          <div style="margin-top:14px;padding:20px;border:1px solid #242424;background:#050505;">
            <p style="margin:0 0 9px;color:#777;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;">Notas</p>
            <p style="margin:0;color:#f3f0ea;font-size:13px;line-height:1.7;">${escapeHtml(order.notes || "Sin notas")}</p>
          </div>
        `,
      }),
    });

    if (result.error) return { ok: false, errorMessage: result.error.message };
    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, ...parseEmailError(error) };
  }
}

export async function sendOrderStatusEmail(order: EmailOrder): Promise<EmailResult> {
  try {
    const statusLabel = getOrderStatusLabel(order.status);
    const result = await getResend().emails.send({
      from: getFromEmail(),
      to: [order.customerEmail],
      subject: `Actualizacion de tu pedido OVRLMT - ${order.orderCode}`,
      html: emailLayout({
        preheader: `Tu pedido ${order.orderCode} cambio a: ${statusLabel}.`,
        badge: "Actualizacion de pedido",
        title: "Tu pedido fue actualizado.",
        intro: `El estado actual de tu pedido es: ${statusLabel}. Puedes revisar el resumen y las notas de seguimiento abajo.`,
        orderCode: order.orderCode,
        children: `
          <div style="padding:20px;border:1px solid #242424;background:#0b0b0b;">
            <p style="margin:0 0 16px;color:#777;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;">Estado actual</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0;">
              ${detailRow("Pedido", order.orderCode)}
              ${detailRow("Producto", order.productName)}
              ${detailRow("Talla", order.size)}
              ${detailRow("Cantidad", order.quantity)}
              ${detailRow("Estado", statusLabel, { strong: true })}
            </table>
          </div>
          <div style="margin-top:14px;padding:20px;border:1px solid #2d1517;background:#130609;">
            <p style="margin:0 0 9px;color:#777;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;">Notas de seguimiento</p>
            <p style="margin:0;color:#f3f0ea;font-size:13px;line-height:1.7;">${escapeHtml(order.notes || "Sin notas nuevas por ahora.")}</p>
          </div>
          <div style="margin-top:14px;padding:18px;border:1px solid #242424;background:#050505;">
            <p style="margin:0;color:#8a8f98;font-size:12px;line-height:1.7;">
              Este correo es solo de notificacion. Para responder o resolver dudas, escribe a <a href="mailto:${CONTACT_EMAIL}" style="color:#f3f0ea;text-decoration:none;">${CONTACT_EMAIL}</a>.
            </p>
          </div>
        `,
      }),
    });

    if (result.error) return { ok: false, errorMessage: result.error.message };
    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, ...parseEmailError(error) };
  }
}

export async function sendAbandonedCartEmail({
  email,
  customerName,
  itemSummary,
  subtotalMxn,
  checkoutUrl,
}: {
  email: string;
  customerName?: string | null;
  itemSummary: string;
  subtotalMxn: number;
  checkoutUrl: string;
}): Promise<EmailResult> {
  try {
    const result = await getResend().emails.send({
      from: getFromEmail(),
      to: [email],
      subject: "Tu carrito OVRLMT sigue reservado",
      html: emailLayout({
        preheader: "Regresa a tu checkout OVRLMT.",
        badge: "Carrito pendiente",
        title: "Tu drop sigue esperando.",
        intro: `${customerName || "Tu selección"} quedó guardada. El inventario es limitado y la disponibilidad puede cambiar.`,
        orderCode: "CART / OVRLMT",
        children: `
          <div style="padding:20px;border:1px solid #242424;background:#0b0b0b;">
            ${detailRow("Piezas", itemSummary)}
            ${detailRow("Subtotal", formatMoney(subtotalMxn), { strong: true })}
          </div>
          <p style="margin:22px 0;color:#999;font-size:13px;line-height:1.7;">Completa tus datos y elige tarjeta con Clip o transferencia.</p>
          <a href="${escapeHtml(checkoutUrl)}" style="display:inline-block;padding:16px 20px;background:#c1121f;color:#fff;text-decoration:none;font-size:10px;font-weight:800;letter-spacing:.14em;">VOLVER AL CHECKOUT</a>
        `,
      }),
    });
    if (result.error) return { ok: false, errorMessage: result.error.message };
    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, ...parseEmailError(error) };
  }
}
