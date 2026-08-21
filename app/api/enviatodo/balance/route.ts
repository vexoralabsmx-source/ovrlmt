import { NextResponse } from "next/server";
import { getClientBalance } from "@/src/lib/enviatodo";
import { routeError } from "../_utils";
import { requireAdminRequest } from "@/src/lib/adminApi";

export async function GET(request: Request) {
  const auth = await requireAdminRequest(request);
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await getClientBalance());
  } catch (error) {
    return routeError(error);
  }
}
