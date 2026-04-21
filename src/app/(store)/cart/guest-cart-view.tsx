"use client";

import Link from "next/link";
import { Package, ShoppingBag, Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useGuestCart } from "@/lib/guest-cart";
import { formatCurrency } from "@/lib/slugs";

function GuestEmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-store-light-bg">
        <ShoppingBag className="size-10 text-store-muted" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-gray-900">Your cart is empty</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Browse our products and find something you love.
      </p>
      <Link
        href="/shop"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-store-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover"
      >
        Continue Shopping
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

export function GuestCartView() {
  const { items, updateQuantity, removeItem, subtotal } = useGuestCart();

  if (items.length === 0) return <GuestEmptyCart />;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Cart items */}
      <div className="lg:col-span-2 space-y-3">
        {items.map((item) => {
          const lineTotal = item.sellingPrice * item.quantity;
          return (
            <Card key={`${item.productId}:${item.variantId ?? ""}`} className="overflow-hidden">
              <div className="flex gap-4 p-4">
                <Link
                  href={`/shop/${item.slug}`}
                  className="size-20 shrink-0 overflow-hidden rounded-xl bg-store-light-bg sm:size-24"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Package className="size-8 text-store-muted/30" />
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link href={`/shop/${item.slug}`}>
                      <h3 className="text-sm font-medium text-gray-900 hover:text-store-accent sm:text-base">
                        {item.name}
                      </h3>
                    </Link>
                    {item.variantName && (
                      <p className="mt-0.5 text-xs text-gray-400">{item.variantName}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-store-accent">
                        {formatCurrency(item.sellingPrice)}
                      </span>
                      {item.comparePrice && item.comparePrice > item.sellingPrice && (
                        <span className="text-xs text-store-muted line-through">
                          {formatCurrency(item.comparePrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-gray-300">
                      <button
                        className="flex size-8 items-center justify-center rounded-l-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        className="flex size-8 items-center justify-center rounded-r-full text-gray-500 transition-colors hover:bg-gray-100"
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.quantityInStock}
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(lineTotal)}
                      </span>
                      <button
                        className="flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        onClick={() => removeItem(item.productId, item.variantId)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Order summary */}
      <div>
        <Card className="border-t-4 border-t-store-accent">
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900">Order Summary</h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
                </span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-xs text-gray-400">Calculated at checkout</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Estimated Total</span>
                <span className="text-store-accent">{formatCurrency(subtotal)}</span>
              </div>
              <Link
                href="/customer-login?callbackUrl=/checkout"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-store-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover"
              >
                Sign In to Checkout
                <ArrowRight className="size-4" />
              </Link>
              <p className="text-center text-xs text-gray-400">
                Sign in to complete your order. Your cart will be saved.
              </p>
              <Link
                href="/shop"
                className="flex w-full items-center justify-center rounded-full border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
