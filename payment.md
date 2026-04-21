# JazzCash Payment Integration Guide (Phase 15 Next Steps)

This document provides a technical roadmap and analysis for fully integrating JazzCash into the MS Solutions Apple-Grade E-Commerce Storefront.

## Current Setup 
Currently, JazzCash is mocked out in the frontend checkout wizard (`src/app/(store)/checkout/checkout-client.tsx`). The user can select it, but it simply passes the payment method "JAZZCASH" to the backend (`actions/store.ts`).

## Required Steps for Full Integration

### 1. JazzCash Sandbox Credentials
To process transactions, you need active credentials from the JazzCash Sandbox/Developer portal:
- **Merchant ID** 
- **Password**
- **Integrity Salt**
- **Return URL / Callback URL**

### 2. Update Environment Variables 
Add the following to your `.env` and `.env.production` files:
```env
JAZZCASH_MERCHANT_ID="your_merchant_id"
JAZZCASH_PASSWORD="your_password"
JAZZCASH_INTEGRITY_SALT="your_salt"
JAZZCASH_ENVIRONMENT="sandbox" # switch to "live" in production
```

### 3. Backend Modification (`src/actions/store.ts`)
Instead of directly marking the order as complete when "JAZZCASH" is selected, the server action `placeOrder` needs to construct an encrypted payload.

```typescript
// Pseudocode for generating the JazzCash Hash
import crypto from "crypto";

function generateSecureHash(payload: Record<string, string>, salt: string) {
    // 1. Sort payload keys alphabetically
    // 2. Concatenate values with '&'
    // 3. Prepend the salt
    // 4. Generate HMAC SHA256 Hash
    // 5. Return uppercase hex hash
}
```

The server action should return a redirect URL pointing to the JazzCash payment gateway with the necessary encrypted POST parameters (e.g., `pp_Amount`, `pp_TxnRefNo`, `pp_SecureHash`).

### 4. Create a Payment Gateway Return Route (`src/app/api/payment/jazzcash/route.ts`)
JazzCash requires an endpoint to ping once the payment succeeds or fails. 

```typescript
// src/app/api/payment/jazzcash/route.ts
export async function POST(request: Request) {
    const data = await request.formData();
    const responseCode = data.get("pp_ResponseCode");
    const orderId = data.get("pp_TxnRefNo");

    if (responseCode === "000") {
        // Payment successful -> Update order status in Neon Database
        await prisma.order.update({
            where: { id: orderId },
            data: { status: "PROCESSING", paymentStatus: "PAID" }
        });
        // Redirect to /order-success
    } else {
        // Payment failed
        // Redirect to /checkout with error
    }
}
```

### 5. Seamless UI/UX Polish
For an Apple-grade seamless experience:
- When "JazzCash" is chosen, replace the "Place Order via WhatsApp" CTA with "Proceed to JazzCash".
- Add a secure lock icon and dynamic loading skeleton while the backend generates the secure hash.
- Consider utilizing the API-based checkout method (Server-to-Server) rather than Page Redirects if you want the customer to stay on `ms.solutions` the entire time for higher conversion rates.
