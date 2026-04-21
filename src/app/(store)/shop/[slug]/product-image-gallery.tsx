"use client";

import { useState } from "react";
import { Package, ZoomIn } from "lucide-react";

type ProductImage = {
  id: string;
  url: string;
  altText: string | null;
};

export function ProductImageGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const activeImage = images[activeIndex] ?? null;

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div
        className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-store-light-bg"
        onClick={() => setZoomed(!zoomed)}
      >
        {activeImage ? (
          <img
            src={activeImage.url}
            alt={activeImage.altText || productName}
            className={`size-full object-cover transition-transform duration-500 ${zoomed ? "scale-150" : "scale-100 group-hover:scale-105"}`}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-24 text-store-muted/30" />
          </div>
        )}

        {/* Zoom hint */}
        {activeImage && !zoomed && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
            <ZoomIn className="size-3 text-white" />
            <span className="text-[10px] text-white">Click to zoom</span>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => { setActiveIndex(index); setZoomed(false); }}
              className={`relative size-20 shrink-0 overflow-hidden rounded-xl bg-store-light-bg ring-2 transition-all ${
                index === activeIndex
                  ? "ring-store-accent"
                  : "ring-transparent hover:ring-store-accent/40"
              }`}
            >
              <img
                src={image.url}
                alt={image.altText || `${productName} ${index + 1}`}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
