import "server-only";

const DEFAULT_CLIP_API_URL = "https://api.payclip.com";

export type ClipCheckoutStatus =
  | "CHECKOUT_CREATED"
  | "CHECKOUT_PENDING"
  | "CHECKOUT_CANCELLED"
  | "CHECKOUT_EXPIRED"
  | "CHECKOUT_COMPLETED";

export type ClipCheckout = {
  payment_request_id: string;
  payment_request_url?: string;
  status: ClipCheckoutStatus;
  amount?: number;
  currency?: string;
  receipt_no?: string;
};

export class ClipApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ClipApiError";
  }
}

function getClipAuthorization() {
  const configuredToken = process.env.CLIP_AUTH_TOKEN?.trim();
  if (configuredToken) {
    return /^(Basic|Bearer)\s/i.test(configuredToken) ? configuredToken : `Basic ${configuredToken}`;
  }

  const apiKey = process.env.CLIP_API_KEY?.trim();
  const apiSecret = process.env.CLIP_API_SECRET?.trim();
  if (!apiKey || !apiSecret) {
    throw new Error("Faltan CLIP_AUTH_TOKEN o CLIP_API_KEY y CLIP_API_SECRET.");
  }

  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

async function clipRequest<T>(path: string, init?: RequestInit) {
  const baseUrl = (process.env.CLIP_API_BASE_URL || DEFAULT_CLIP_API_URL).replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getClipAuthorization(),
      ...init?.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });

  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const message =
      (typeof body?.message === "string" && body.message) ||
      (typeof body?.error === "string" && body.error) ||
      "Clip rechazó la solicitud.";
    throw new ClipApiError(message, response.status);
  }

  return body as T;
}

export async function createClipCheckout(payload: Record<string, unknown>) {
  const checkout = await clipRequest<ClipCheckout>("/v2/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!checkout.payment_request_id || !checkout.payment_request_url) {
    throw new ClipApiError("Clip no devolvió un enlace de pago válido.", 502);
  }

  return checkout;
}

export function getClipCheckout(paymentRequestId: string) {
  return clipRequest<ClipCheckout>(`/v2/checkout/${encodeURIComponent(paymentRequestId)}`);
}

export function isClipCheckoutPaid(status: string) {
  return status === "CHECKOUT_COMPLETED";
}
