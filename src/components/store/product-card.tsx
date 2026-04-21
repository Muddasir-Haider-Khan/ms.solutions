"use client";

import Link from "next/link";
import { Package, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/slugs";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    sellingPrice: number;
    comparePrice: number | null;
    brand: string | null;
    quantityInStock: number;
    featured?: boolean;
    category?: { id: string; name: string; slug: string } | null;
    images: { url: string; altText: string | null }[];
  };
  onAddToCart?: (productId: string) => void;
  isAddingToCart?: boolean;
  showAddToCart?: boolean;
};

export function ProductCard({
  product,
  onAddToCart,
  isAddingToCart = false,
  showAddToCart = true,
}: ProductCardProps) {
  const hasDiscount =
    product.comparePrice && product.comparePrice > product.sellingPrice;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.comparePrice! - product.sellingPrice) /
          product.comparePrice!) *
          100
      )
    : 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:shadow-lg hover:shadow-black/8">
      {/* Product Image */}
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-store-light-bg">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].altText || product.name}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Package className="size-12 text-store-muted/40" />
            </div>
          )}

          {/* Badges */}
          {product.featured && (
            <span className="absolute left-2.5 top-2.5 rounded-md bg-store-dark px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Featured
            </span>
          )}
          {hasDiscount && (
            <span className="absolute right-2.5 top-2.5 rounded-md bg-store-sale px-2 py-0.5 text-[11px] font-bold text-white">
              -{discountPercent}%
            </span>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-3.5">
        {product.category && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-store-muted">
            {product.category.name}
          </p>
        )}

        <Link href={`/shop/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 transition-colors hover:text-store-accent">
            {product.name}
          </h3>
        </Link>

        {product.brand && (
          <p className="mt-0.5 text-[11px] text-store-muted">{product.brand}</p>
        )}

        {/* Price */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-base font-bold text-store-accent">
            {formatCurrency(product.sellingPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-store-muted line-through">
              {formatCurrency(product.comparePrice!)}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        {showAddToCart && (
          <div className="mt-3">
            {product.quantityInStock > 0 ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onAddToCart?.(product.id);
                }}
                disabled={isAddingToCart}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-store-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-store-accent-hover disabled:opacity-50"
              >
                <ShoppingCart className="size-3.5" />
                {isAddingToCart ? "Adding..." : "Add to Cart"}
              </button>
            ) : (
              <span className="flex w-full items-center justify-center rounded-full border border-store-muted/40 px-4 py-2 text-xs font-medium text-store-muted">
                Out of Stock
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
