"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden w-full max-w-2xl items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-white/10 lg:flex"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for products, brands and more..."
        className="h-[46px] flex-1 border-0 bg-transparent px-6 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
      />
      <button
        type="submit"
        className="flex h-[46px] items-center gap-1.5 bg-[#00796b] px-6 text-[13px] font-semibold text-white transition-colors hover:bg-[#005f56]"
      >
        <Search className="size-4" />
        Search
      </button>
    </form>
  );
}
