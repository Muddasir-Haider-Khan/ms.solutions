"use client";

import { useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/slugs";

function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`size-3.5 ${
            i <= rating ? "fill-[#00796b] text-[#00796b]" : "fill-gray-200 text-gray-200"
          }`}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  comparePrice?: number | null;
  brand?: string | null;
  quantityInStock: number;
  images?: { url: string; altText?: string | null }[];
  category?: { name: string } | null;
}

export function ProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = product.images && product.images.length > 0 && !imgError;
  const hasDiscount = product.comparePrice && product.comparePrice > product.sellingPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.comparePrice! - product.sellingPrice) / product.comparePrice!) * 100)
    : 0;

  return (
    <Link href={`/shop/${product.slug}`}>
      <div className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-200 hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-[#f9f9f9]">
          {hasImage ? (
            <img
              src={product.images![0].url}
              alt={product.images![0].altText || product.name}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Package className="size-12 text-gray-200" />
            </div>
          )}
          {hasDiscount && (
            <span className="absolute left-2.5 top-2.5 rounded border border-[#333] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#333]">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="p-3.5">
          {product.category && (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {product.category.name}
            </p>
          )}
          <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-[#222]">
            {product.name}
          </h3>
          <div className="mt-1.5">
            <StarRating rating={5} />
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[15px] font-bold text-[#222]">
              {formatCurrency(product.sellingPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[12px] text-gray-400 line-through">
                {formatCurrency(product.comparePrice!)}
              </span>
            )}
          </div>
          {product.quantityInStock <= 0 && (
            <span className="mt-1.5 inline-block rounded bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
