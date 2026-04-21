"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";

interface Category {
  id: string;
  name: string;
  image: string | null;
  _count: { products: number };
}

const VISIBLE = 6;

export function CategoryCarousel({ categories }: { categories: Category[] }) {
  const [index, setIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const max = Math.max(0, categories.length - VISIBLE);

  const canPrev = index > 0;
  const canNext = index < max;

  return (
    <div className="relative px-10">
      {/* Prev */}
      <button
        onClick={() => setIndex((i) => Math.max(0, i - 1))}
        disabled={!canPrev}
        aria-label="Previous"
        className="absolute left-0 top-[38%] z-10 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 transition-all hover:bg-[#00796b] hover:text-white hover:border-[#00796b] disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronLeft className="size-4" />
      </button>

      {/* Track */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-400 ease-in-out"
          style={{ transform: `translateX(-${index * (100 / VISIBLE)}%)` }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.id}`}
              className="group shrink-0 flex flex-col items-center gap-3"
              style={{ width: `${100 / VISIBLE}%`, padding: "0 8px" }}
            >
              <div className="w-full overflow-hidden rounded-2xl bg-[#f5f5f5] aspect-square flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:bg-[#eef7f5]">
                {cat.image && !imgErrors[cat.id] ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="size-[72%] object-contain transition-transform duration-300 group-hover:scale-110"
                    onError={() => setImgErrors((e) => ({ ...e, [cat.id]: true }))}
                  />
                ) : (
                  <Package className="size-10 text-gray-300 transition-colors group-hover:text-[#00796b]" />
                )}
              </div>
              <div className="text-center">
                <h4 className="text-[13px] font-semibold text-[#222] group-hover:text-[#00796b] transition-colors">
                  {cat.name}
                </h4>
                <p className="text-[11px] text-gray-400">
                  {cat._count.products} product{cat._count.products !== 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Next */}
      <button
        onClick={() => setIndex((i) => Math.min(max, i + 1))}
        disabled={!canNext}
        aria-label="Next"
        className="absolute right-0 top-[38%] z-10 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 transition-all hover:bg-[#00796b] hover:text-white hover:border-[#00796b] disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
