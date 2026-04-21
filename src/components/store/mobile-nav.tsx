"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Search, X, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileNavProps = {
  categories: { id: string; name: string; slug: string }[];
};

export function MobileNav({ categories }: MobileNavProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setOpen(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button className="flex size-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden" />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-left text-base">Menu</SheetTitle>
        </SheetHeader>

        {/* Mobile search */}
        <div className="border-b px-4 py-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-store-accent"
            />
            <button
              type="submit"
              className="flex size-9 items-center justify-center rounded-lg bg-store-accent text-white"
            >
              <Search className="size-4" />
            </button>
          </form>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-b px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Home
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/shop"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-b px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Shop All
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="border-b">
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {cat.name}
                  <ChevronRight className="size-3.5 text-muted-foreground/50" />
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/cart"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-b px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cart
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
