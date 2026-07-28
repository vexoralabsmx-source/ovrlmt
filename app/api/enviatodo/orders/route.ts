import { NextResponse } from "next/server";
import { getOrders } from "@/src/lib/enviatodo";
import { routeError } from "../_utils";

export async function GET() {
  try {
    return NextResponse.json(await getOrders());
  } catch (error) {
    return routeError(error);
  }
}
