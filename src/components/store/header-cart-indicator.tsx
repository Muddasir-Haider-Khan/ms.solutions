"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useGuestCart } from "@/lib/guest-cart";

export function HeaderCartIndicator() {
  const { itemCount } = useGuestCart();

  return (
    <Link
      href="/cart"
      className="relative flex size-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      <ShoppingCart className="size-5" />
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-store-accent text-[10px] font-bold text-white">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
