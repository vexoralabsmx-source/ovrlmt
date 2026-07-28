import "server-only";
import { getEnviatodoEnv } from "./env";
import { EnviatodoError, enviatodoStatusMessage } from "./errors";
import type { EnviatodoResult } from "./types";

type EnviatodoRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  headers?: HeadersInit;
  responseType?: "auto" | "json" | "text" | "arrayBuffer";
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function parseJwtDate(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 10_000_000_000 ? value : value * 1000;
  }

  if (typeof value !== "string") return null;
  const normalized = value.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function readTokenExpiration(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const decoded = JSON.parse(decodeBase64Url(payload)) as {
      exp?: unknown;
      iat?: unknown;
      issuedAt?: unknown;
      ttl?: unknown;
    };

    const exp = parseJwtDate(decoded.exp);
    if (exp) return exp;

    const issuedAt = parseJwtDate(decoded.issuedAt ?? decoded.iat);
    const ttl = typeof decoded.ttl === "number" && Number.isFinite(decoded.ttl) ? decoded.ttl : null;
    if (!issuedAt || !ttl) return null;

    return issuedAt + ttl * 1000;
  } catch {
    return null;
  }
}

function assertTokenIsUsable(token: string) {
  const expiresAt = readTokenExpiration(token);
  if (!expiresAt || Date.now() < expiresAt) return;

  const expiresAtIso = new Date(expiresAt).toISOString();
  throw new EnviatodoError(
    401,
    `El token de EnviaTodo esta vencido desde ${expiresAtIso}. Genera un token nuevo y actualiza ENVIATODO_TOKEN.`,
    { code: "expired_enviatodo_token", expiresAt: expiresAtIso },
    "expired_enviatodo_token",
  );
}

function buildUrl(endpoint: string) {
  const env = getEnviatodoEnv();
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  return new URL(endpoint.replace(/^\/+/, ""), env.baseUrl).toString();
}

async function parseResponse(response: Response, responseType: EnviatodoRequestOptions["responseType"] = "auto") {
  const contentType = response.headers.get("content-type") || "";
  if (responseType === "arrayBuffer") return response.arrayBuffer();
  if (responseType === "text") return response.text();
  if (responseType === "json" || contentType.includes("application/json")) {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  return response.text();
}

export async function enviatodoRequest<T = unknown>(
  endpoint: string,
  options: EnviatodoRequestOptions = {},
): Promise<EnviatodoResult<T>> {
  const env = getEnviatodoEnv();
  const method = options.method || "GET";
  assertTokenIsUsable(env.token);

  const response = await fetch(buildUrl(endpoint), {
    method,
    headers: {
      "Content-Type": env.contentType,
      // Algunos quickstarts antiguos muestran "Bearer: TOKEN"; si "Bearer TOKEN" falla con 401, confirmar manualmente con EnviaTodo antes de cambiarlo.
      Authorization: `Bearer ${env.token}`,
      "x-api-key": env.apiKey,
      "x-enviatodo-app": env.app,
      ...options.headers,
    },
    body: method === "POST" ? JSON.stringify(options.body ?? {}) : undefined,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const data = await parseResponse(response, options.responseType).catch((error) => ({
    parse_error: error instanceof Error ? error.message : "No se pudo leer la respuesta.",
  }));

  if (!response.ok) {
    throw new EnviatodoError(response.status, enviatodoStatusMessage(response.status), data);
  }

  return {
    ok: true,
    configured: true,
    sandbox: env.mode === "sandbox",
    status: response.status,
    data: data as T,
    contentType,
  };
}
