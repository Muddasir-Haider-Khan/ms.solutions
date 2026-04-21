import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeJazzCashHash,
  formatJazzCashDate,
  generateTxnRef,
  toPaisas,
  getJazzCashUrl,
  type JazzCashEnv,
} from "@/lib/jazzcash";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, amount, orderNumber } = await req.json();

  if (!orderId || !amount || !orderNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify the order exists (guests have no userId — just check by orderId)
  const userId = (session.user as { id?: string })?.id;
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...(userId ? { userId } : {}),
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const merchantId   = process.env.JAZZCASH_MERCHANT_ID;
  const password     = process.env.JAZZCASH_PASSWORD;
  const salt         = process.env.JAZZCASH_INTEGRITY_SALT;
  const env          = (process.env.JAZZCASH_ENV ?? "sandbox") as JazzCashEnv;
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!merchantId || !password || !salt) {
    return NextResponse.json(
      { error: "JazzCash credentials not configured. Please set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT in your environment variables." },
      { status: 503 }
    );
  }

  const now     = new Date();
  const expiry  = new Date(now.getTime() + 30 * 60 * 1000); // 30 min from now
  const txnRef  = generateTxnRef(orderNumber);

  const params: Record<string, string> = {
    PP_Version:            "1.1",
    PP_TxnType:            "MWALLET",
    PP_Language:           "EN",
    PP_MerchantID:         merchantId,
    PP_SubMerchantID:      "",
    PP_Password:           password,
    PP_BankID:             "TBANK",
    PP_ProductID:          "RETL",
    PP_TxnRefNo:           txnRef,
    PP_Amount:             toPaisas(amount),
    PP_TxnCurrency:        "PKR",
    PP_TxnDateTime:        formatJazzCashDate(now),
    PP_BillReference:      orderNumber,
    PP_Description:        `Order ${orderNumber} - Multi Solutions Store`,
    PP_TxnExpiryDateTime:  formatJazzCashDate(expiry),
    PP_ReturnURL:          `${appUrl}/api/jazzcash/callback`,
    PP_IsRegisteredCustomer: "No",
    PP_tokenizedDetail:    "",
    PP_retrievalReferenceNo: txnRef,
    PP_UsageData:          "",
  };

  // Remove empty values before hashing
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "")
  );

  const hash = computeJazzCashHash(cleanParams, salt);

  // Store the txnRef on the order so we can match it on callback
  await prisma.order.update({
    where: { id: orderId },
    data: { notes: `JazzCash TxnRef: ${txnRef}` },
  });

  return NextResponse.json({
    formAction: getJazzCashUrl(env),
    params: { ...cleanParams, PP_SecureHash: hash },
    txnRef,
  });
}
