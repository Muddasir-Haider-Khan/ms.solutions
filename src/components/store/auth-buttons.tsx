"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { User, LogOut, ShoppingBag, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Close dropdown when clicking outside
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

  // Guest state — show Login & Signup buttons
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/customer-login"
          className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  // Authenticated state — show user dropdown
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
        className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm transition-colors hover:bg-muted"
      >
        <div className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {initials}
        </div>
        <span className="hidden text-xs font-medium sm:block max-w-[100px] truncate">
          {user.name}
        </span>
        <ChevronDown
          className={`size-3 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border bg-background shadow-lg shadow-black/10 animate-in fade-in-0 zoom-in-95">
          {/* User info */}
          <div className="border-b px-4 py-3">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/account/orders"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ShoppingBag className="size-4" />
              My Orders
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <User className="size-4" />
              My Account
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t py-1">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
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
