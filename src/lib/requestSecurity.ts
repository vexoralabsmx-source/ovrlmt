import "server-only";
import { NextResponse } from "next/server";

type RateBucket = { count: number; resetAt: number };
type SecurityGlobal = typeof globalThis & {
  __ovrlmtRateBuckets?: Map<string, RateBucket>;
  __ovrlmtRateSweep?: number;
};

type GuardOptions = {
  bucket: string;
  limit: number;
  windowMs: number;
  maxBodyBytes?: number;
  requireJson?: boolean;
};

const securityGlobal = globalThis as SecurityGlobal;
const buckets = securityGlobal.__ovrlmtRateBuckets ?? new Map<string, RateBucket>();
securityGlobal.__ovrlmtRateBuckets = buckets;

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function sweepExpired(now: number) {
  securityGlobal.__ovrlmtRateSweep = (securityGlobal.__ovrlmtRateSweep || 0) + 1;
  if (securityGlobal.__ovrlmtRateSweep % 100 !== 0) return;
  for (const [key, value] of buckets) if (value.resetAt <= now) buckets.delete(key);
}

async function bodyExceedsLimit(request: Request, maxBytes: number) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declared) && declared > maxBytes) return true;
  if (!request.body || (declared > 0 && declared <= maxBytes)) return false;

  const reader = request.clone().body?.getReader();
  if (!reader) return false;
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return false;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        return true;
      }
    }
  } catch {
    return true;
  }
}

function securityResponse(message: string, status: number, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(
    { ok: false, error: message },
    { status, headers: { "Cache-Control": "no-store", ...extraHeaders } },
  );
}

export async function guardRequest(request: Request, options: GuardOptions) {
  if (options.requireJson && !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return securityResponse("El contenido debe enviarse como JSON.", 415);
  }

  if (options.maxBodyBytes && await bodyExceedsLimit(request, options.maxBodyBytes)) {
    return securityResponse("La solicitud es demasiado grande.", 413);
  }

  const now = Date.now();
  sweepExpired(now);
  const key = `${options.bucket}:${clientIp(request)}`;
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + options.windowMs }
    : { count: current.count + 1, resetAt: current.resetAt };
  buckets.set(key, bucket);

  if (bucket.count > options.limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return securityResponse("Demasiadas solicitudes. Intenta de nuevo más tarde.", 429, {
      "Retry-After": String(retryAfter),
      "X-RateLimit-Limit": String(options.limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000)),
    });
  }

  return null;
}
