/**
 * JazzCash utility helpers
 *
 * JazzCash Pakistan Payment Gateway
 * Docs: https://sandbox.jazzcash.com.pk/docs
 *
 * Flow:
 * 1. Server generates PP_SecureHash using HMAC-SHA256
 * 2. Client auto-POSTs form to JazzCash redirect URL
 * 3. JazzCash redirects back to PP_ReturnURL
 * 4. Server verifies the returned hash and updates order status
 */

import crypto from "crypto";

export type JazzCashEnv = "sandbox" | "production";

export function getJazzCashUrl(env: JazzCashEnv = "sandbox") {
  return env === "production"
    ? "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
    : "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
}

/**
 * Compute the PP_SecureHash:
 * 1. Collect all PP_ params (except PP_SecureHash itself)
 * 2. Sort alphabetically by key
 * 3. Concatenate: IntegritySalt&key1=value1&key2=value2&...
 * 4. HMAC-SHA256 using IntegritySalt as key → UPPERCASE hex
 */
export function computeJazzCashHash(
  params: Record<string, string>,
  integritySalt: string
): string {
  const sorted = Object.keys(params)
    .filter((k) => k !== "PP_SecureHash" && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const message = `${integritySalt}&${sorted}`;

  return crypto
    .createHmac("sha256", integritySalt)
    .update(message)
    .digest("hex")
    .toUpperCase();
}

/** Format Date as YYYYMMDDHHMMSS (JazzCash format) */
export function formatJazzCashDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

/** Convert amount in PKR to paisas (×100, integer string) */
export function toPaisas(amount: number): string {
  return Math.round(amount * 100).toString();
}

/** Generate unique transaction ref: MSMS + timestamp + random 4 digits */
export function generateTxnRef(orderNumber: string): string {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 9000 + 1000).toString();
  // Remove non-alphanumeric from order number, trim to 8 chars
  const safe = orderNumber.replace(/[^A-Z0-9]/gi, "").slice(0, 8).toUpperCase();
  return `T${safe}${ts}${rand}`.slice(0, 30); // max 30 chars
}
