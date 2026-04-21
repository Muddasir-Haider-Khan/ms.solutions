import Link from "next/link";
import { ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCart } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";
import { CartClient } from "./cart-client";
import { GuestCartView } from "./guest-cart-view";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "Cart - MS Solutions",
  description: "Review your shopping cart",
};

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;

  const cartResult = isAuthenticated ? await getCart() : { success: false as const, data: null };
  const cart = cartResult.success ? cartResult.data : null;

  const cartItems = cart?.items ?? [];
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
          href="/shop"
          className="flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Shopping Cart
          </h1>
        </div>
      </div>

      {/* Authenticated user with DB cart items */}
      {isAuthenticated && cartItems.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CartClient cartItems={cartItems} />
          </div>

          <div>
            <Card className="border-t-4 border-t-store-accent">
              <CardHeader>
                <CardTitle className="text-gray-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Subtotal ({cartItems.length} item
                    {cartItems.length !== 1 ? "s" : ""})
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-xs text-gray-400">
                    Calculated at checkout
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold text-gray-900">
                  <span>Estimated Total</span>
                  <span className="text-store-accent">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-store-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover"
                >
                  Proceed to Checkout
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/shop"
                  className="flex w-full items-center justify-center rounded-full border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Continue Shopping
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Guest user: show client-side guest cart */}
      {!isAuthenticated && <GuestCartView />}

      {/* Empty state (authenticated with empty cart) */}
      {isAuthenticated && cartItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-store-light-bg">
            <ShoppingBag className="size-10 text-store-muted" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">
            Your cart is empty
          </h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Looks like you have not added anything to your cart yet. Browse our
            products and find something you love.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-store-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover"
          >
            Continue Shopping
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
