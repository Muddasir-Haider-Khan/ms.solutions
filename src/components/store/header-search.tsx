"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const suggestedKeywords = ["Laptop", "Mobile", "Headphones", "Camera", "Tablet"];

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleKeywordClick(keyword: string) {
    router.push(`/shop?search=${encodeURIComponent(keyword)}`);
  }

  return (
    <div className="hidden flex-1 flex-col items-center gap-1.5 px-8 lg:flex">
      <form onSubmit={handleSubmit} className="flex w-full max-w-xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for products..."
          className="h-10 flex-1 rounded-l-full border-0 bg-white px-5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          className="flex h-10 items-center gap-1.5 rounded-r-full bg-store-accent px-5 text-sm font-medium text-white transition-colors hover:bg-store-accent-hover"
        >
          <Search className="size-4" />
          Search
        </button>
      </form>
      <div className="flex items-center gap-1.5">
        {suggestedKeywords.map((keyword) => (
          <button
            key={keyword}
            onClick={() => handleKeywordClick(keyword)}
            className="rounded-full px-2.5 py-0.5 text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            {keyword}
          </button>
        ))}
      </div>
    </div>
  );
}
