"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { addToCart } from "@/actions/store";
import { toast } from "sonner";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  sellingPrice: number;
  quantityInStock: number;
  trackInventory: boolean;
  variants: Array<{
    id: string;
    name: string;
    sellingPrice: number | null;
    comparePrice: number | null;
    quantityInStock: number;
    isActive: boolean;
  }>;
};

export function ProductDetailClient({
  product,
  isAuthenticated = false,
}: {
  product: Product;
  isAuthenticated?: boolean;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const selectedVariant = selectedVariantId
    ? product.variants.find((v) => v.id === selectedVariantId)
    : null;

  const currentPrice = selectedVariant?.sellingPrice ?? product.sellingPrice;
  const availableStock = selectedVariant
    ? selectedVariant.quantityInStock
    : product.quantityInStock;
  const isInStock = !product.trackInventory || availableStock > 0;

  function incrementQuantity() {
    if (quantity < availableStock || !product.trackInventory) {
      setQuantity((q) => q + 1);
    }
  }

  function decrementQuantity() {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  }

  async function handleAddToCart() {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to your cart");
      router.push(`/customer-login?callbackUrl=/shop/${product.slug}`);
      return;
    }
    startTransition(async () => {
      const result = await addToCart({
        productId: product.id,
        variantId: selectedVariantId ?? undefined,
        quantity,
      });
      if (result.success) {
        toast.success(`${product.name} added to cart`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to add to cart");
      }
    });
  }

  async function handleBuyNow() {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to your cart");
      router.push(`/customer-login?callbackUrl=/shop/${product.slug}`);
      return;
    }
    startTransition(async () => {
      const result = await addToCart({
        productId: product.id,
        variantId: selectedVariantId ?? undefined,
        quantity,
      });
      if (result.success) {
        router.push("/cart");
      } else {
        toast.error(result.error || "Failed to add to cart");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Variant selection */}
      {product.variants && product.variants.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Options</h3>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => {
                  setSelectedVariantId(variant.id);
                  setQuantity(1);
                }}
                className={`rounded-full border px-4 py-2 text-sm transition-all ${
                  selectedVariantId === variant.id
                    ? "border-store-accent bg-store-accent-light text-store-accent ring-1 ring-store-accent"
                    : "border-gray-300 text-gray-700 hover:border-store-accent/50"
                } ${!variant.isActive ? "cursor-not-allowed opacity-50" : ""}`}
                disabled={!variant.isActive}
              >
                {variant.name}
                {variant.sellingPrice !== null && (
                  <span className="ml-1 text-xs text-gray-400">
                    (+{variant.sellingPrice})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity selector */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Quantity</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-gray-300">
            <button
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className="flex size-9 items-center justify-center rounded-l-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
            >
              <Minus className="size-3.5" />
            </button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val > 0) setQuantity(val);
              }}
              className="h-9 w-14 border-0 text-center text-sm font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              min={1}
              max={availableStock || undefined}
            />
            <button
              onClick={incrementQuantity}
              disabled={product.trackInventory && quantity >= availableStock}
              className="flex size-9 items-center justify-center rounded-r-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          {product.trackInventory && (
            <span className="text-xs text-gray-400">
              {availableStock} available
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {!isAuthenticated ? (
        <div className="space-y-3 pt-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Please sign in to add items to your cart
          </div>
          <div className="flex gap-3">
            <Link
              href={`/customer-login?callbackUrl=/shop/${product.slug}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-store-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover"
            >
              <LogIn className="size-4" />
              Sign In
            </Link>
            <Link
              href="/signup"
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
            >
              Create Account
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 pt-2">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-store-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover disabled:opacity-50"
            disabled={!isInStock || isPending}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="size-4" />
            {isPending ? "Adding..." : "Add to Cart"}
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-store-accent px-6 py-3 text-sm font-semibold text-store-accent transition-colors hover:bg-store-accent-light disabled:opacity-50"
            disabled={!isInStock || isPending}
            onClick={handleBuyNow}
          >
            Buy Now
          </button>
        </div>
      )}
    </div>
  );
}
