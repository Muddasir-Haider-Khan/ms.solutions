import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCart } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";
import { CheckoutClient } from "./checkout-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Checkout - Multi Solutions Store",
  description: "Complete your order",
};

export default async function CheckoutPage() {
  const cartResult = await getCart();
  const cart = cartResult.success ? cartResult.data : null;

  const cartItems = cart?.items ?? [];

  if (cartItems.length === 0) {
    redirect("/cart");
  }

  const subtotal = cartItems.reduce((sum, item) => {
    const price =
      item.productVariant?.sellingPrice ?? item.product.sellingPrice;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/cart"
          className="flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Checkout
          </h1>
          <p className="text-sm text-gray-500">Complete your order details</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutClient />
        </div>

        <div>
          <Card className="border-t-4 border-t-store-accent">
            <CardHeader>
              <CardTitle className="text-gray-900">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const price =
                    item.productVariant?.sellingPrice ??
                    item.product.sellingPrice;
                  const image = item.product.images?.[0];

                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-store-light-bg">
                        {image ? (
                          <img
                            src={image.url}
                            alt={image.altText || item.product.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Package className="size-5 text-store-muted/30" />
                          </div>
                        )}
                        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-store-accent text-[10px] font-bold text-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-gray-900">
                          {item.product.name}
                        </p>
                        {item.productVariant && (
                          <p className="text-xs text-gray-400">
                            {item.productVariant.name}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-xs text-gray-400">
                    Calculated at next step
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-base font-bold">
                <span className="text-gray-900">Estimated Total</span>
                <span className="text-store-accent">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
