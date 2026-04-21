"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Heart, RotateCcw, Eye, Package } from "lucide-react";
import { formatCurrency } from "@/lib/slugs";

interface Product {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  comparePrice?: number | null;
  images?: { url: string; altText?: string | null }[];
  category?: { name: string } | null;
}

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

const VISIBLE = 5;

export function NewArrivalsCarousel({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const max = Math.max(0, products.length - VISIBLE);

  return (
    <div className="relative px-10">
      {/* Prev */}
      <button
        onClick={() => setIndex((i) => Math.max(0, i - 1))}
        disabled={index === 0}
        aria-label="Previous"
        className="absolute left-0 top-[40%] z-10 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 transition-all hover:bg-[#00796b] hover:text-white hover:border-[#00796b] disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronLeft className="size-4" />
      </button>

      {/* Track */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-400 ease-in-out"
          style={{ transform: `translateX(-${index * (100 / VISIBLE)}%)` }}
        >
          {products.map((product) => {
            const hasImage = product.images && product.images.length > 0 && !imgErrors[product.id];
            const hasDiscount = product.comparePrice && product.comparePrice > product.sellingPrice;
            return (
              <div
                key={product.id}
                className="group shrink-0"
                style={{ width: `${100 / VISIBLE}%`, padding: "0 8px" }}
              >
                <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="relative aspect-square overflow-hidden bg-[#f7f7f7]">
                    <Link href={`/shop/${product.slug}`} className="block size-full">
                      {hasImage ? (
                        <img
                          src={product.images![0].url}
                          alt={product.images![0].altText || product.name}
                          className="size-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                          onError={() => setImgErrors((e) => ({ ...e, [product.id]: true }))}
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Package className="size-12 text-gray-200" />
                        </div>
                      )}
                    </Link>

                    {/* Hover overlay buttons — outside the Link to avoid nested <a> */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2.5 bg-black/5 opacity-0 transition-all duration-300 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                      <button
                        onClick={(e) => { e.preventDefault(); }}
                        title="Wishlist"
                        className="flex size-9 translate-y-3 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 hover:bg-[#00796b] hover:text-white group-hover:translate-y-0"
                      >
                        <Heart className="size-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/shop/compare?id=${product.id}`)}
                        title="Compare"
                        className="flex size-9 translate-y-3 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 hover:bg-[#00796b] hover:text-white group-hover:translate-y-0 [transition-delay:50ms]"
                      >
                        <RotateCcw className="size-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/shop/${product.slug}`)}
                        title="View"
                        className="flex size-9 translate-y-3 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 hover:bg-[#00796b] hover:text-white group-hover:translate-y-0 [transition-delay:100ms]"
                      >
                        <Eye className="size-4" />
                      </button>
                    </div>

                    {hasDiscount && (
                      <span className="absolute left-2.5 top-2.5 rounded-lg border border-[#333] bg-white px-2 py-0.5 text-[11px] font-bold text-[#333]">
                        -{Math.round(((product.comparePrice! - product.sellingPrice) / product.comparePrice!) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="p-3.5">
                    {product.category && (
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{product.category.name}</p>
                    )}
                    <Link href={`/shop/${product.slug}`}>
                      <h3 className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug text-[#222] transition-colors hover:text-[#00796b]">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="mt-1.5"><StarRating rating={5} /></div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#222]">{formatCurrency(product.sellingPrice)}</span>
                      {hasDiscount && (
                        <span className="text-[12px] text-gray-400 line-through">{formatCurrency(product.comparePrice!)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next */}
      <button
        onClick={() => setIndex((i) => Math.min(max, i + 1))}
        disabled={index >= max}
        aria-label="Next"
        className="absolute right-0 top-[40%] z-10 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 transition-all hover:bg-[#00796b] hover:text-white hover:border-[#00796b] disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
