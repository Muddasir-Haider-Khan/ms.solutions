"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, RotateCcw, Eye, Package } from "lucide-react";
import { formatCurrency } from "@/lib/slugs";

function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={`size-3.5 ${i <= rating ? "fill-[#00796b] text-[#00796b]" : "fill-gray-200 text-gray-200"}`}>
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
  images?: { url: string; altText?: string | null }[];
  category?: { name: string } | null;
}

export function HoverProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = product.images && product.images.length > 0 && !imgError;

  return (
    <div className="group relative border-b border-r border-gray-100 bg-white p-4 transition-shadow hover:shadow-md hover:z-10">
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-[#f7f7f7] rounded-xl">
        {hasImage ? (
          <img
            src={product.images![0].url}
            alt={product.images![0].altText || product.name}
            className="size-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-12 text-gray-200" />
          </div>
        )}

        {/* Hover action buttons */}
        <div className="absolute inset-0 flex items-center justify-center gap-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-black/5">
          <button
            onClick={(e) => e.preventDefault()}
            title="Add to wishlist"
            className="flex size-9 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-[#00796b] hover:text-white"
          >
            <Heart className="size-4" />
          </button>
          <Link
            href={`/shop/compare?id=${product.id}`}
            title="Compare"
            className="flex size-9 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-[#00796b] hover:text-white"
          >
            <RotateCcw className="size-4" />
          </Link>
          <Link
            href={`/shop/${product.slug}`}
            title="View product"
            className="flex size-9 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-[#00796b] hover:text-white"
          >
            <Eye className="size-4" />
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3">
        {product.category && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{product.category.name}</p>
        )}
        <Link href={`/shop/${product.slug}`}>
          <h3 className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug text-[#222] hover:text-[#00796b] transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1.5">
          <StarRating rating={5} />
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[15px] font-bold text-[#222]">{formatCurrency(product.sellingPrice)}</span>
          {product.comparePrice && product.comparePrice > product.sellingPrice && (
            <span className="text-[12px] text-gray-400 line-through">{formatCurrency(product.comparePrice)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
