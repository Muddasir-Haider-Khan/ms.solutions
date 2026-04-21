"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface BannerSlide {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl: string;
  linkUrl: string;
  bgColor: string;
}

const FALLBACK_SLIDES: BannerSlide[] = [
  {
    id: "f1",
    title: "iPhone 15 Pro Max",
    subtitle: "Titanium. So Strong. So Light. So Pro.",
    description: "The most powerful iPhone ever",
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=1600&h=500&fit=crop&auto=format&q=80",
    linkUrl: "/shop",
    bgColor: "#1a2035",
  },
  {
    id: "f2",
    title: "Sony WH-1000XM5",
    subtitle: "Industry-leading noise cancellation",
    description: "Exceptional sound, all day comfort",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&h=500&fit=crop&auto=format&q=80",
    linkUrl: "/shop",
    bgColor: "#1a1a1a",
  },
  {
    id: "f3",
    title: "Meta Quest 2",
    subtitle: "All-in-one VR",
    description: "Explore limitless VR worlds",
    imageUrl: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=1600&h=500&fit=crop&auto=format&q=80",
    linkUrl: "/shop",
    bgColor: "#0d1117",
  },
];

export function PromoSlider({ banners }: { banners?: BannerSlide[] }) {
  const slides = banners && banners.length > 0 ? banners : FALLBACK_SLIDES;
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = (idx: number) => {
    setCurrent((idx + slides.length) % slides.length);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  const slide = slides[current];

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ backgroundColor: slide.bgColor, minHeight: "420px" }}
    >
      {/* Background image */}
      {!imgErrors[slide.id] && (
        <img
          key={slide.id}
          src={slide.imageUrl}
          alt={slide.title}
          className="absolute inset-0 size-full object-cover transition-opacity duration-500"
          onError={() => setImgErrors((prev) => ({ ...prev, [slide.id]: true }))}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-center px-12 py-14" style={{ minHeight: "420px" }}>
        <p className="text-[13px] font-semibold uppercase tracking-widest text-white/60">
          {slide.subtitle}
        </p>
        <h2 className="mt-2 text-[36px] font-bold leading-tight text-white md:text-[46px]">
          {slide.title}
        </h2>
        {slide.description && (
          <p className="mt-2 text-[15px] text-white/70">{slide.description}</p>
        )}
        <div className="mt-7">
          <Link
            href={slide.linkUrl}
            className="inline-flex items-center gap-2 rounded-md bg-[#00796b] px-7 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white hover:text-[#00796b]"
          >
            Shop Now
          </Link>
        </div>
      </div>

      {/* Prev / Next */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => { go(current - 1); resetTimer(); }}
            aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/40"
          >
            <ChevronLeft className="size-5 text-white" />
          </button>
          <button
            onClick={() => { go(current + 1); resetTimer(); }}
            aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/40"
          >
            <ChevronRight className="size-5 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { go(i); resetTimer(); }}
              aria-label={`Slide ${i + 1}`}
              className={`size-2 rounded-full transition-all ${
                i === current ? "bg-white w-6" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
