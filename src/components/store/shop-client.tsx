"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Search,
  SlidersHorizontal,
  X,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { addToCart } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { useGuestCart } from "@/lib/guest-cart";

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  sellingPrice: number;
  comparePrice: number | null;
  brand: string | null;
  quantityInStock: number;
  featured: boolean;
  createdAt: Date;
  category: { id: string; name: string; slug: string } | null;
  images: { url: string; altText: string | null }[];
};

type Category = {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
};

type ProductsData = {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function ShopClient({
  products,
  categories,
  brands,
  currentSearch,
  currentCategory,
  currentBrand,
  currentMinPrice,
  currentMaxPrice,
  currentSort,
  isAuthenticated = false,
}: {
  products: ProductsData | null;
  categories: Category[];
  brands: string[];
  currentSearch: string;
  currentCategory: string;
  currentBrand: string;
  currentMinPrice: string;
  currentMaxPrice: string;
  currentSort: string;
  isAuthenticated?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestCart = useGuestCart();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // Collapsible filter sections
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [brandsOpen, setBrandsOpen] = useState(true);

  const initialMin = currentMinPrice ? parseInt(currentMinPrice, 10) : 0;
  const initialMax = currentMaxPrice ? parseInt(currentMaxPrice, 10) : 50000;
  const [localPriceParams, setLocalPriceParams] = useState({
    min: currentMinPrice,
    max: currentMaxPrice,
  });
  const [sliderValue, setSliderValue] = useState<[number, number]>([
    initialMin,
    initialMax,
  ]);

  const currentPage = products?.pagination?.page ?? 1;
  const totalPages = products?.pagination?.totalPages ?? 1;

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    if (!updates.hasOwnProperty("page")) {
      params.delete("page");
    }
    startTransition(() => {
      router.push(`/shop?${params.toString()}`);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ search: searchQuery });
  }

  function handleCategoryToggle(categoryId: string) {
    const newCategory = currentCategory === categoryId ? "" : categoryId;
    updateFilters({ category: newCategory });
  }

  function handleBrandToggle(brand: string) {
    const newBrand = currentBrand === brand ? "" : brand;
    updateFilters({ brand: newBrand });
  }

  function handleSortChange(value: string | null) {
    updateFilters({ sort: value ?? "newest" });
  }

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`/shop?${params.toString()}`);
    });
  }

  function handlePriceFilter() {
    updateFilters({
      minPrice: localPriceParams.min,
      maxPrice: localPriceParams.max,
    });
  }

  function handleSliderChange(val: [number, number]) {
    setSliderValue(val);
    setLocalPriceParams({ min: val[0].toString(), max: val[1].toString() });
  }

  async function handleAddToCart(product: Product) {
    if (!isAuthenticated) {
      guestCart.addItem({
        productId: product.id,
        quantity: 1,
        name: product.name,
        slug: product.slug,
        sellingPrice: product.sellingPrice,
        comparePrice: product.comparePrice,
        image: product.images?.[0]?.url || null,
        quantityInStock: product.quantityInStock,
      });
      toast.success("Added to cart");
      return;
    }
    setAddingToCart(product.id);
    try {
      const result = await addToCart({ productId: product.id, quantity: 1 });
      if (result.success) {
        toast.success("Added to cart");
      } else {
        toast.error(result.error || "Failed to add to cart");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAddingToCart(null);
    }
  }

  function clearAllFilters() {
    setLocalPriceParams({ min: "", max: "" });
    setSliderValue([0, 50000]);
    startTransition(() => {
      router.push("/shop");
    });
  }

  const hasActiveFilters =
    currentSearch ||
    currentCategory ||
    currentBrand ||
    currentMinPrice ||
    currentMaxPrice;

  const filterContent = (
    <div className="space-y-1">
      {/* Categories */}
      <div>
        <button
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="flex w-full items-center justify-between py-3 text-sm font-semibold text-gray-900"
        >
          Categories
          {categoriesOpen ? (
            <ChevronUp className="size-4 text-gray-400" />
          ) : (
            <ChevronDown className="size-4 text-gray-400" />
          )}
        </button>
        {categoriesOpen && (
          <div className="space-y-2 pb-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-2"
              >
                <Checkbox
                  checked={currentCategory === category.id}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <span className="text-sm text-gray-700">{category.name}</span>
                <span className="ml-auto text-xs text-gray-400">
                  ({category._count.products})
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <button
          onClick={() => setPriceOpen(!priceOpen)}
          className="flex w-full items-center justify-between py-3 text-sm font-semibold text-gray-900"
        >
          Price Range
          {priceOpen ? (
            <ChevronUp className="size-4 text-gray-400" />
          ) : (
            <ChevronDown className="size-4 text-gray-400" />
          )}
        </button>
        {priceOpen && (
          <div className="space-y-3 pb-3">
            <Slider
              min={0}
              max={100000}
              step={500}
              value={sliderValue}
              minStepsBetweenValues={1}
              onValueChange={(val: any) => handleSliderChange(val)}
              className="w-full"
            />
            <div className="flex items-center justify-between font-medium">
              <span className="text-xs text-gray-500">
                {formatCurrency(sliderValue[0])}
              </span>
              <span className="text-xs text-gray-500">
                {formatCurrency(sliderValue[1])}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={localPriceParams.min}
                onChange={(e) => {
                  setLocalPriceParams((prev) => ({
                    ...prev,
                    min: e.target.value,
                  }));
                  setSliderValue([Number(e.target.value) || 0, sliderValue[1]]);
                }}
                className="h-8 text-xs"
              />
              <span className="text-gray-400">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={localPriceParams.max}
                onChange={(e) => {
                  setLocalPriceParams((prev) => ({
                    ...prev,
                    max: e.target.value,
                  }));
                  setSliderValue([
                    sliderValue[0],
                    Number(e.target.value) || 100000,
                  ]);
                }}
                className="h-8 text-xs"
              />
            </div>
            <button
              onClick={handlePriceFilter}
              className="w-full rounded-full bg-store-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-store-accent-hover"
            >
              Apply Price Filter
            </button>
          </div>
        )}
      </div>

      <Separator />

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <button
            onClick={() => setBrandsOpen(!brandsOpen)}
            className="flex w-full items-center justify-between py-3 text-sm font-semibold text-gray-900"
          >
            Brands
            {brandsOpen ? (
              <ChevronUp className="size-4 text-gray-400" />
            ) : (
              <ChevronDown className="size-4 text-gray-400" />
            )}
          </button>
          {brandsOpen && (
            <div className="space-y-2 pb-3">
              {brands.map((brand) => (
                <label
                  key={brand}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Checkbox
                    checked={currentBrand === brand}
                    onCheckedChange={() => handleBrandToggle(brand)}
                  />
                  <span className="text-sm text-gray-700">{brand}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {hasActiveFilters && (
        <>
          <Separator />
          <button
            onClick={clearAllFilters}
            className="mt-2 w-full rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
          >
            Clear All Filters
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Shop</h1>
        <p className="text-sm text-gray-500">
          {products
            ? `${products.pagination.total} product${products.pagination.total !== 1 ? "s" : ""} found`
            : "Loading products..."}
        </p>
      </div>

      {/* Search and Sort Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={handleSearch}
          className="flex flex-1 gap-0 sm:max-w-md"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-l-full border border-r-0 border-gray-300 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-store-accent focus:outline-none focus:ring-1 focus:ring-store-accent"
            />
          </div>
          <button
            type="submit"
            className="rounded-r-full bg-store-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <button
            className="flex h-10 items-center gap-2 rounded-full border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            <SlidersHorizontal className="size-4" />
            Filters
          </button>

          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[160px] rounded-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filters badges */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {currentSearch && (
            <span className="flex items-center gap-1 rounded-full bg-store-accent-light px-3 py-1 text-xs font-medium text-store-accent">
              Search: {currentSearch}
              <button onClick={() => updateFilters({ search: "" })}>
                <X className="size-3" />
              </button>
            </span>
          )}
          {currentCategory && (
            <span className="flex items-center gap-1 rounded-full bg-store-accent-light px-3 py-1 text-xs font-medium text-store-accent">
              Category:{" "}
              {categories.find((c) => c.id === currentCategory)?.name ||
                currentCategory}
              <button onClick={() => updateFilters({ category: "" })}>
                <X className="size-3" />
              </button>
            </span>
          )}
          {currentBrand && (
            <span className="flex items-center gap-1 rounded-full bg-store-accent-light px-3 py-1 text-xs font-medium text-store-accent">
              Brand: {currentBrand}
              <button onClick={() => updateFilters({ brand: "" })}>
                <X className="size-3" />
              </button>
            </span>
          )}
          {(currentMinPrice || currentMaxPrice) && (
            <span className="flex items-center gap-1 rounded-full bg-store-accent-light px-3 py-1 text-xs font-medium text-store-accent">
              Price: {currentMinPrice || "0"} - {currentMaxPrice || "..."}
              <button
                onClick={() => updateFilters({ minPrice: "", maxPrice: "" })}
              >
                <X className="size-3" />
              </button>
            </span>
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl border bg-white p-4">
            {filterContent}
          </div>
        </aside>

        {/* Mobile Filters */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-80 max-w-full overflow-y-auto bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  <X className="size-5" />
                </Button>
              </div>
              {filterContent}
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          {products && products.products.length > 0 ? (
            <>
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 ${isPending ? "opacity-50" : "transition-opacity duration-300"}`}
              >
                {products.products.map((product) => {
                  const hasDiscount =
                    product.comparePrice &&
                    product.comparePrice > product.sellingPrice;
                  const discountPercent = hasDiscount
                    ? Math.round(
                        ((product.comparePrice! - product.sellingPrice) /
                          product.comparePrice!) *
                          100
                      )
                    : 0;

                  return (
                    <div
                      key={product.id}
                      className="group overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:shadow-lg hover:shadow-black/8"
                    >
                      <Link href={`/shop/${product.slug}`}>
                        <div className="relative aspect-square overflow-hidden bg-store-light-bg">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].url}
                              alt={product.images[0].altText || product.name}
                              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <Package className="size-12 text-store-muted/40" />
                            </div>
                          )}
                          {product.featured && (
                            <span className="absolute left-2.5 top-2.5 rounded-md bg-store-dark px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                              Featured
                            </span>
                          )}
                          {hasDiscount && (
                            <span className="absolute right-2.5 top-2.5 rounded-md bg-store-sale px-2 py-0.5 text-[11px] font-bold text-white">
                              -{discountPercent}%
                            </span>
                          )}
                        </div>
                      </Link>
                      <div className="p-3.5">
                        {product.category && (
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-store-muted">
                            {product.category.name}
                          </p>
                        )}
                        <Link href={`/shop/${product.slug}`}>
                          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 transition-colors hover:text-store-accent">
                            {product.name}
                          </h3>
                        </Link>
                        {product.shortDescription && (
                          <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                            {product.shortDescription}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-base font-bold text-store-accent">
                            {formatCurrency(product.sellingPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-store-muted line-through">
                              {formatCurrency(product.comparePrice!)}
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          {product.quantityInStock > 0 ? (
                            <button
                              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-store-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-store-accent-hover disabled:opacity-50"
                              disabled={addingToCart === product.id}
                              onClick={() => handleAddToCart(product)}
                            >
                              <ShoppingCart className="size-3.5" />
                              {addingToCart === product.id
                                ? "Adding..."
                                : "Add to Cart"}
                            </button>
                          ) : (
                            <span className="flex w-full items-center justify-center rounded-full border border-store-muted/40 px-4 py-2 text-xs font-medium text-store-muted">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                          />
                        </PaginationItem>
                      )}

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1
                          );
                        })
                        .map((page, index, arr) => {
                          const prev = arr[index - 1];
                          const showEllipsis = prev && page - prev > 1;
                          return (
                            <span key={page} className="flex items-center">
                              {showEllipsis && (
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  isActive={page === currentPage}
                                  onClick={() => handlePageChange(page)}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            </span>
                          );
                        })}

                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="size-16 text-store-muted/30" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No products found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
              <button
                className="mt-4 rounded-full border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                onClick={clearAllFilters}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
