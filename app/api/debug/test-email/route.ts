import { NextResponse } from "next/server";
import { sendAdminPreorderNotification } from "@/src/lib/resend";

function parseEmailError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Resend test failed.";
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, code: "not_found" }, { status: 404 });
  }

  try {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL || !process.env.ADMIN_NOTIFICATION_EMAIL) {
      return NextResponse.json({
        ok: false,
        code: "missing_env_vars",
        errorMessage: "Missing RESEND_API_KEY, RESEND_FROM_EMAIL or ADMIN_NOTIFICATION_EMAIL.",
      }, { status: 500 });
    }

    const result = await sendAdminPreorderNotification({
      orderCode: "OVR-TEST-0001",
      customerName: "Cliente OVRLMT",
      customerEmail: "cliente@example.com",
      customerWhatsapp: "+52 55 0000 0000",
      productName: "OVRLMT DROP PIECE",
      size: "M",
      quantity: 1,
      subtotalMxn: 899,
      discountMxn: 0,
      shippingMxn: 150,
      totalMxn: 1049,
      discountCode: null,
      status: "test_email",
      addressCity: "CDMX",
      addressState: "CDMX",
      notes: "Correo de prueba con el nuevo diseño.",
    });

    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        code: "resend_test_failed",
        errorMessage: result.errorMessage,
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      code: "resend_test_failed",
      errorMessage: parseEmailError(error),
    }, { status: 500 });
  }
}
