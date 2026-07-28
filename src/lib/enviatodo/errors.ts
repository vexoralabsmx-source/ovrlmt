import type { EnviatodoApiError } from "./types";

export class EnviatodoError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown, code?: string) {
    super(message);
    this.name = "EnviatodoError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function enviatodoStatusMessage(status: number) {
  if (status === 401) return "EnviaTodo rechazo la autenticacion. Revisa ENVIATODO_TOKEN, expiracion y formato Authorization Bearer.";
  if (status === 403) return "EnviaTodo rechazo permisos para esta operacion. Revisa token vigente, x-api-key y aplicacion.";
  if (status === 422) return "EnviaTodo no pudo procesar el payload. Revisa origen, destino, paquete y servicio seleccionado.";
  if (status >= 500) return "EnviaTodo tuvo un error interno o no esta disponible. Intenta de nuevo mas tarde.";
  return `EnviaTodo respondio con estatus ${status}.`;
}

export function toSafeEnviatodoError(error: unknown): EnviatodoApiError {
  if (error instanceof EnviatodoError) {
    return { ok: false, status: error.status, message: error.message, code: error.code, details: error.details };
  }

  if (error instanceof Error) {
    return { ok: false, status: 500, message: error.message };
  }

  return { ok: false, status: 500, message: "Error desconocido al contactar EnviaTodo." };
}
