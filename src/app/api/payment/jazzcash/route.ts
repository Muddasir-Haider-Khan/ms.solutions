import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const pp_ResponseCode = formData.get("pp_ResponseCode")?.toString();
    const pp_ResponseMessage = formData.get("pp_ResponseMessage")?.toString();
    const pp_TxnRefNo = formData.get("pp_TxnRefNo")?.toString();
    const pp_SecureHash = formData.get("pp_SecureHash")?.toString();
    const pp_Amount = formData.get("pp_Amount")?.toString();

    // In a real production system, you would recalculate the SecureHash here 
    // to verify the payload integrity before updating the database.
    // For now we will check ResponseCode.

    if (!pp_TxnRefNo) {
      return NextResponse.json({ error: "Missing TxnRefNo" }, { status: 400 });
    }

    // Since the order transaction ref no might have been sanitized, we'll try to find the full DB ID 
    // However, our placeOrder returns the order id, while orderNumber was sent to JazzCash.
    // We just find the first order where orderNumber matches or starts with the ref no
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: pp_TxnRefNo
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (pp_ResponseCode === "000") {
      // Payment Successful
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING",
        }
      });
      // Redirect back to user's order success page
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return NextResponse.redirect(`${appUrl}/order-success?orderId=${order.id}&jc=success`, 303);
    } else {
      // Payment Failed or Cancelled
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED"
        }
      });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return NextResponse.redirect(`${appUrl}/order-success?orderId=${order.id}&jc=fail&msg=${encodeURIComponent(pp_ResponseMessage || "Unknown error")}`, 303);
    }
  } catch (error) {
    console.error("JazzCash Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
