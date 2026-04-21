"use client";

import { useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/slugs";

interface DealProduct {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  comparePrice?: number | null;
  images?: { url: string; altText?: string | null }[];
}

export function DealProductCard({ product }: { product: DealProduct }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = product.images && product.images.length > 0 && !imgError;
  const pct = Math.round(
    ((product.comparePrice! - product.sellingPrice) / product.comparePrice!) * 100
  );

  return (
    <Link href={`/shop/${product.slug}`}>
      <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-[#f5f5f5]">
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
          <span className="absolute left-2.5 top-2.5 rounded border border-[#333] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#333]">
            -{pct}%
          </span>
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 text-[13px] font-medium text-[#222]">{product.name}</h3>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[15px] font-bold text-[#00796b]">
              {formatCurrency(product.sellingPrice)}
            </span>
            <span className="text-[12px] text-gray-400 line-through">
              {formatCurrency(product.comparePrice!)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
