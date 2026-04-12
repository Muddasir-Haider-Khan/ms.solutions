import Link from "next/link";
import { ShoppingBag, Package, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCart } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";
import { CartClient } from "./cart-client";

export const metadata = {
  title: "Cart - Multi Solutions Store",
  description: "Review your shopping cart",
};

export default async function CartPage() {
  const cartResult = await getCart();
  const cart = cartResult.success ? cartResult.data : null;

  const cartItems = cart?.items ?? [];
  const subtotal = cartItems.reduce((sum, item) => {
    const price =
      item.productVariant?.sellingPrice ?? item.product.sellingPrice;
    return sum + price * item.quantity;
  }, 0);

  const isEmpty = cartItems.length === 0;

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/shop"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Shopping Cart</h1>
          {!isEmpty && (
            <p className="text-sm text-muted-foreground">
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your
              cart
            </p>
          )}
        </div>
      </div>

      {isEmpty ? (
        /* Empty Cart State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="size-10 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Your cart is empty</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Looks like you have not added anything to your cart yet. Browse our
            products and find something you love.
          </p>
          <Button className="mt-6" render={<Link href="/shop" />}>
            Continue Shopping
            <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : (
        /* Cart with items */
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <CartClient cartItems={cartItems} />
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subtotal ({cartItems.length} item
                    {cartItems.length !== 1 ? "s" : ""})
                  </span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-xs text-muted-foreground">
                    Calculated at checkout
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Estimated Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <Button className="w-full" render={<Link href="/checkout" />}>
                  Proceed to Checkout
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  render={<Link href="/shop" />}
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
