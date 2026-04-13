"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function ProductDetailClient({ product, isAuthenticated = false }: { product: Product; isAuthenticated?: boolean }) {
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
          <h3 className="mb-2 text-sm font-semibold">Options</h3>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => {
                  setSelectedVariantId(variant.id);
                  setQuantity(1);
                }}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  selectedVariantId === variant.id
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                    : "border-input hover:border-primary/50"
                } ${!variant.isActive ? "cursor-not-allowed opacity-50" : ""}`}
                disabled={!variant.isActive}
              >
                {variant.name}
                {variant.sellingPrice !== null && (
                  <span className="ml-1 text-xs text-muted-foreground">
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
        <h3 className="mb-2 text-sm font-semibold">Quantity</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={decrementQuantity}
              disabled={quantity <= 1}
            >
              <Minus className="size-3" />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val > 0) setQuantity(val);
              }}
              className="h-7 w-14 border-0 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              min={1}
              max={availableStock || undefined}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={incrementQuantity}
              disabled={
                product.trackInventory && quantity >= availableStock
              }
            >
              <Plus className="size-3" />
            </Button>
          </div>
          {product.trackInventory && (
            <span className="text-xs text-muted-foreground">
              {availableStock} available
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {!isAuthenticated ? (
        <div className="space-y-3 pt-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            Please sign in to add items to your cart
          </div>
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              render={<Link href={`/customer-login?callbackUrl=/shop/${product.slug}`} />}
            >
              <LogIn className="size-4" />
              Sign In
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              render={<Link href="/signup" />}
            >
              Create Account
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 pt-2">
          <Button
            size="lg"
            className="flex-1"
            disabled={!isInStock || isPending}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="size-4" />
            {isPending ? "Adding..." : "Add to Cart"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1"
            disabled={!isInStock || isPending}
            onClick={handleBuyNow}
          >
            Buy Now
          </Button>
        </div>
      )}
    </div>
  );
}
