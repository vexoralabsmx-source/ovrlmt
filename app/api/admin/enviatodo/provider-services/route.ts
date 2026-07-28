import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/src/lib/adminApi";
import { getProviderServices } from "@/src/lib/enviatodo";
import { adminEnviatodoError } from "../_utils";

export async function GET(request: Request) {
  const auth = await requireAdminRequest(request);
  if (!auth.ok) return auth.response;
  try {
    const result = await getProviderServices();
    return NextResponse.json(result, { status: result.ok ? 200 : result.status });
  } catch (error) {
    return adminEnviatodoError(error);
  }
}
