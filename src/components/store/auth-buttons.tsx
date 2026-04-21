"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { User, LogOut, ShoppingBag, ChevronDown } from "lucide-react";

type AuthButtonsProps = {
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
};

export function AuthButtons({ user }: AuthButtonsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href="/customer-login"
          className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="flex h-8 items-center gap-1.5 rounded-full bg-store-accent px-3.5 text-xs font-semibold text-white transition-colors hover:bg-store-accent-hover"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex h-8 items-center gap-1.5 rounded-full px-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <div className="flex size-6 items-center justify-center rounded-full bg-store-accent text-[10px] font-bold text-white">
          {initials}
        </div>
        <span className="hidden max-w-[100px] truncate text-xs font-medium sm:block">
          {user.name}
        </span>
        <ChevronDown
          className={`size-3 text-white/50 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border bg-white shadow-xl shadow-black/15 animate-in fade-in-0 zoom-in-95">
          <div className="border-b px-4 py-3">
            <p className="truncate text-sm font-medium text-gray-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>

          <div className="py-1">
            <Link
              href="/account/orders"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-store-accent-light hover:text-store-accent"
            >
              <ShoppingBag className="size-4" />
              My Orders
            </Link>
            <Link
              href="/account"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-store-accent-light hover:text-store-accent"
            >
              <User className="size-4" />
              My Account
            </Link>
          </div>

          <div className="border-t py-1">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
