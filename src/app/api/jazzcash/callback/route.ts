import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeJazzCashHash, type JazzCashEnv } from "@/lib/jazzcash";

/**
 * JazzCash POSTs back here after the customer completes (or abandons) payment.
 * We verify the hash, update the order status, and redirect to the correct page.
 *
 * Success response codes:
 *   000 = Success
 *   001 = Pending (treat as processing)
 *
 * All other codes = failure
 */
export async function POST(req: NextRequest) {
  let body: Record<string, string> = {};

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    params.forEach((value, key) => { body[key] = value; });
  } else {
    body = await req.json();
  }

  const salt = process.env.JAZZCASH_INTEGRITY_SALT;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!salt) {
    return NextResponse.redirect(`${appUrl}/order-failed?reason=config`);
  }

  // Verify hash
  const receivedHash = body.PP_SecureHash ?? "";
  const paramsWithoutHash = Object.fromEntries(
    Object.entries(body).filter(([k]) => k !== "PP_SecureHash")
  );
  const expectedHash = computeJazzCashHash(paramsWithoutHash, salt);

  if (receivedHash !== expectedHash) {
    console.error("[JazzCash] Hash mismatch", { receivedHash, expectedHash });
    return NextResponse.redirect(`${appUrl}/order-failed?reason=tampered`);
  }

  const responseCode = body.PP_ResponseCode ?? "";
  const txnRef       = body.PP_TxnRefNo ?? "";
  const billRef      = body.PP_BillReference ?? ""; // order number

  // Find order by order number stored in PP_BillReference
  const order = await prisma.order.findFirst({
    where: { orderNumber: billRef },
  });

  if (!order) {
    return NextResponse.redirect(`${appUrl}/order-failed?reason=not_found`);
  }

  if (responseCode === "000" || responseCode === "001") {
    // Payment successful — update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CONFIRMED",
        paymentMethod: "JAZZCASH",
        notes: `JazzCash payment successful. TxnRef: ${txnRef}. ResponseCode: ${responseCode}`,
      },
    });

    return NextResponse.redirect(
      `${appUrl}/order-success?orderId=${order.id}&payment=jazzcash`
    );
  } else {
    // Payment failed/cancelled
    const reason = encodeURIComponent(
      body.PP_ResponseMessage ?? "Payment failed or was cancelled"
    );
    return NextResponse.redirect(
      `${appUrl}/order-failed?orderId=${order.id}&reason=${reason}`
    );
  }
}

// JazzCash can also GET (some redirect scenarios)
export async function GET(req: NextRequest) {
  return POST(req);
}
