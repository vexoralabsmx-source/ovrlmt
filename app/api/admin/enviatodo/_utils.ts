import { NextResponse } from "next/server";
import { EnviatodoError, toSafeEnviatodoError } from "@/src/lib/enviatodo";

export function adminEnviatodoError(error: unknown) {
  const safeError = toSafeEnviatodoError(error);
  const status = error instanceof EnviatodoError ? error.status : safeError.status;
  if (status >= 500) console.error("admin_enviatodo_error", { status, message: safeError.message });
  return NextResponse.json(safeError, { status });
}
