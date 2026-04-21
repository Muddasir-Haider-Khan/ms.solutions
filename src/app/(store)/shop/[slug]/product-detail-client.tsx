"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/actions/store";
import { toast } from "sonner";
import { useGuestCart } from "@/lib/guest-cart";

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  sellingPrice: number;
  comparePrice?: number | null;
  quantityInStock: number;
  trackInventory: boolean;
  images?: { url: string }[];
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
  const guestCart = useGuestCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedVariant = selectedVariantId
    ? product.variants.find((v) => v.id === selectedVariantId)
    : null;

  const availableStock = selectedVariant
    ? selectedVariant.quantityInStock
    : product.quantityInStock;
  const isInStock = !product.trackInventory || availableStock > 0;

  async function handleAddToCart() {
    if (!isAuthenticated) {
      guestCart.addItem({
        productId: product.id,
        quantity,
        name: product.name,
        slug: product.slug,
        sellingPrice: product.sellingPrice,
        comparePrice: product.comparePrice || null,
        image: product.images?.[0]?.url || null,
        quantityInStock: product.quantityInStock,
      });
      toast.success(`${product.name} added to cart`);
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
      guestCart.addItem({
        productId: product.id,
        quantity,
        name: product.name,
        slug: product.slug,
        sellingPrice: product.sellingPrice,
        comparePrice: product.comparePrice || null,
        image: product.images?.[0]?.url || null,
        quantityInStock: product.quantityInStock,
      });
      router.push("/cart");
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
        <div className="mb-4">
          <h3 className="mb-1 text-[14px] text-[#0F1111] font-bold">Style Name:</h3>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => {
                  setSelectedVariantId(variant.id);
                  setQuantity(1);
                }}
                className={`border text-[13px] px-3 py-1.5 transition-colors ${
                  selectedVariantId === variant.id
                    ? "border-[#E77600] bg-[#FDF8E4] ring-1 ring-[#e77600]"
                    : "border-[#D5D9D9] hover:bg-[#F3F3F3]"
                } ${!variant.isActive ? "disabled cursor-not-allowed opacity-50" : ""}`}
                disabled={!variant.isActive}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Dropdown (Amazon style) */}
      <div className="mt-4 mb-2">
        <div className="relative inline-block w-20">
          <select
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full bg-[#F0F2F2] border border-[#D5D9D9] hover:bg-[#E3E6E6] rounded-md py-1 px-2 text-[13px] text-[#0F1111] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#008296] focus:border-transparent shadow-[0_2px_5px_rgba(213,217,217,0.5)]"
          >
            {[...Array(Math.min(10, availableStock || 10))].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Qty: {i + 1}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#0F1111]">
            <ChevronDown className="size-3" />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <Button
          className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] rounded-full h-[32px] text-[13px] shadow-[0_2px_5px_rgba(213,217,217,0.5)] font-normal border border-[#FCD200]/50"
          disabled={!isInStock || isPending}
          onClick={handleAddToCart}
        >
          {isPending ? "Adding..." : "Add to Cart"}
        </Button>
        <Button
          className="w-full bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] rounded-full h-[32px] text-[13px] shadow-[0_2px_5px_rgba(213,217,217,0.5)] font-normal border border-[#FF8F00]/50"
          disabled={!isInStock || isPending}
          onClick={handleBuyNow}
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
