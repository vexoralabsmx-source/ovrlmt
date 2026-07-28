import { NextResponse } from "next/server";
import { getClientBalance } from "@/src/lib/enviatodo";
import { routeError } from "../_utils";

export async function GET() {
  try {
    return NextResponse.json(await getClientBalance());
  } catch (error) {
    return routeError(error);
  }
}
