import Link from "next/link";
import {
  ArrowRight,
  Package,
  Truck,
  Shield,
  CreditCard,
  ChevronRight,
  Store,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { getStoreProducts, getStoreCategories } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";

export const metadata = {
  title: "Multi Solutions Store - Electronic Mega Market",
  description:
    "Shop quality electronics & gadgets at competitive prices. Fast delivery nationwide.",
};

export default async function StoreHomePage() {
  const [featuredResult, allProductsResult, categoriesResult] =
    await Promise.all([
      getStoreProducts({ featured: true, limit: 8 }),
      getStoreProducts({ limit: 12, sort: "newest" }),
      getStoreCategories(),
    ]);

  const featuredProducts =
    featuredResult.success && featuredResult.data
      ? featuredResult.data.products
      : [];
  const allProducts =
    allProductsResult.success && allProductsResult.data
      ? allProductsResult.data.products
      : [];
  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : [];

  const dealsProducts = allProducts.filter(
    (p) => p.comparePrice && p.comparePrice > p.sellingPrice
  );

  return (
    <div className="flex flex-col">
      {/* ===== HERO BANNER GRID ===== */}
      <section className="bg-[#f5f5f5]">
        <div className="container mx-auto px-4 py-5">
          <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2" style={{ minHeight: '460px' }}>
            {/* Main large banner - left 2/3 */}
            <div className="relative md:col-span-2 md:row-span-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#f0f4f8] to-[#e8edf2]">
              <div className="relative z-10 flex h-full flex-col justify-center p-8 md:p-12">
                <h2 className="text-[15px] font-medium text-[#222]">
                  Sony 5G Headphone
                </h2>
                <p className="mt-1 text-[13px] text-[#666]">
                  Only Music. Nothing Else.
                </p>
                <div className="mt-5">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 rounded-md bg-[#222222] px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#333]"
                  >
                    View Details
                  </Link>
                </div>
              </div>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#d0d8e0]/50 to-transparent" />
            </div>

            {/* Middle banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#e8edf2] to-[#d5dce5]">
              <div className="relative z-10 flex h-full flex-col p-6">
                <h2 className="text-[15px] font-medium text-[#222]">
                  Air Mavic 3
                </h2>
                <p className="mt-1 text-[13px] text-[#666]">
                  As powerful as it is portable
                </p>
                <div className="mt-4">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-[#222] hover:text-store-accent"
                  >
                    Shop now
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom right - split into 2 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#eee] to-[#ddd] p-5">
                <h3 className="text-[14px] font-medium text-[#222]">Handheld</h3>
                <p className="mt-0.5 text-[12px] text-[#666]">USB 3 Rechargeable</p>
                <Link
                  href="/shop"
                  className="mt-3 inline-flex items-center text-[12px] font-medium text-[#222] hover:text-store-accent"
                >
                  Shop now &rarr;
                </Link>
              </div>
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#eee] to-[#ddd] p-5">
                <h3 className="text-[14px] font-medium text-[#222]">Gearbox</h3>
                <p className="mt-0.5 text-[12px] text-[#666]">Upto 30% Discount</p>
                <Link
                  href="/shop"
                  className="mt-3 inline-flex items-center text-[12px] font-medium text-[#222] hover:text-store-accent"
                >
                  Shop now &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BENEFITS / USP BAR ===== */}
      <section className="border-b border-gray-200 bg-white">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-5 md:grid-cols-5">
          {[
            {
              icon: Tag,
              text: (
                <>Log in <span className="font-semibold text-store-accent">get up to 50% discounts</span></>
              ),
            },
            {
              icon: Store,
              text: "Open new stores in your city",
            },
            {
              icon: Truck,
              text: "Free fast express delivery with tracking",
            },
            {
              icon: ShieldCheck,
              text: "Equipment loose and damage insurance",
            },
            {
              icon: CreditCard,
              text: "Installment without overpayments",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <item.icon className="size-5 shrink-0 text-[#222]" />
              <p className="text-[12px] leading-snug text-[#555]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== POPULAR CATEGORIES ===== */}
      {categories.length > 0 && (
        <section className="bg-white">
          <div className="container mx-auto px-4 py-10">
            <h2 className="mb-7 text-[22px] font-bold text-[#222]">
              Popular Categories
            </h2>

            <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {categories
                .filter((cat) => cat._count.products > 0)
                .map((category) => (
                  <Link
                    key={category.id}
                    href={`/shop?category=${category.id}`}
                    className="group flex flex-col items-center gap-3 text-center"
                  >
                    <div className="flex size-[100px] items-center justify-center overflow-hidden rounded-full bg-[#f5f5f5] transition-transform duration-300 group-hover:scale-105">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="size-full rounded-full object-cover"
                        />
                      ) : (
                        <Package className="size-10 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold uppercase text-[#222] group-hover:text-store-accent">
                        {category.name}
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        {category._count.products} product
                        {category._count.products !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== NEW ARRIVAL PRODUCTS ===== */}
      {featuredProducts.length > 0 && (
        <section className="bg-white">
          <div className="container mx-auto px-4 py-10">
            <div className="mb-7 flex items-center justify-between">
              <h2 className="text-[22px] font-bold text-[#222]">
                New Arrival Products
              </h2>
              <Link
                href="/shop"
                className="flex items-center gap-1 text-[13px] font-medium text-store-accent hover:underline"
              >
                View All
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {featuredProducts.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PROMO BANNERS - 3 Column ===== */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-6 md:p-8">
              <div className="relative z-10">
                <h3 className="text-[18px] font-bold text-white">
                  Experience Sound
                </h3>
                <h4 className="text-[18px] font-bold text-white">
                  Freedom with AirPods
                </h4>
                <Link
                  href="/shop"
                  className="mt-4 inline-flex items-center gap-1 rounded bg-store-accent px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-store-accent-hover"
                >
                  See Category
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#f5e6d3] to-[#e8d5c0] p-6 md:p-8">
              <div className="relative z-10">
                <p className="text-[12px] font-medium uppercase tracking-wider text-[#888]">
                  New Camera. New Design.
                </p>
                <h3 className="mt-1 text-[22px] font-bold text-[#222]">
                  iPhone 15 Pro Max
                </h3>
                <Link
                  href="/shop"
                  className="mt-4 inline-flex items-center gap-1 rounded bg-[#222] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#333]"
                >
                  See Category
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] p-6 md:p-8">
              <div className="relative z-10">
                <p className="text-[12px] font-medium uppercase tracking-wider text-[#888]">
                  New Camera. New Design.
                </p>
                <h3 className="mt-1 text-[22px] font-bold text-[#222]">
                  iPhone 15 Pro Max
                </h3>
                <Link
                  href="/shop"
                  className="mt-4 inline-flex items-center gap-1 rounded bg-store-accent px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-store-accent-hover"
                >
                  See Category
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== OUR ADVANTAGES ===== */}
      <section className="bg-[#f5f5f5]">
        <div className="container mx-auto px-4 py-10">
          <h2 className="mb-7 text-center text-[22px] font-bold text-[#222]">
            Our Advantages
          </h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { icon: Truck, title: "Free Delivery", desc: "Free shipping on all orders" },
              { icon: ShieldCheck, title: "Return Policy", desc: "Free returns within 30 days" },
              { icon: Shield, title: "24/7 Support", desc: "Dedicated help center" },
              { icon: CreditCard, title: "Secure Payment", desc: "Safe & secure checkout" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 text-center shadow-sm">
                <div className="flex size-14 items-center justify-center rounded-full bg-store-accent-light">
                  <item.icon className="size-6 text-store-accent" />
                </div>
                <h4 className="text-[14px] font-semibold text-[#222]">{item.title}</h4>
                <p className="text-[12px] text-[#888]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DEALS OF THE DAY ===== */}
      {dealsProducts.length > 0 && (
        <section className="bg-white">
          <div className="container mx-auto px-4 py-10">
            <div className="mb-7 flex items-center justify-between">
              <h2 className="text-[22px] font-bold text-[#222]">
                Deals Of The Day
              </h2>
              <Link
                href="/shop"
                className="flex items-center gap-1 text-[13px] font-medium text-store-accent hover:underline"
              >
                View All Deals
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {dealsProducts.slice(0, 4).map((product) => {
                const discountPercent = Math.round(
                  ((product.comparePrice! - product.sellingPrice) /
                    product.comparePrice!) *
                    100
                );

                return (
                  <Link key={product.id} href={`/shop/${product.slug}`}>
                    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg">
                      <div className="relative aspect-square overflow-hidden bg-[#f5f5f5]">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].altText || product.name}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Package className="size-12 text-gray-200" />
                          </div>
                        )}
                        <span className="absolute left-2.5 top-2.5 rounded border border-[#333] px-2 py-0.5 text-[11px] font-semibold text-[#333]">
                          -{discountPercent}%
                        </span>
                      </div>
                      <div className="p-3.5">
                        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-[#222]">
                          {product.name}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[15px] font-bold text-store-accent">
                            {formatCurrency(product.sellingPrice)}
                          </span>
                          <span className="text-[12px] text-gray-400 line-through">
                            {formatCurrency(product.comparePrice!)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== RECENTLY LAUNCHED / ALL PRODUCTS ===== */}
      {allProducts.length > 0 && (
        <section className="bg-[#f5f5f5]">
          <div className="container mx-auto px-4 py-10">
            <div className="mb-7 flex items-center justify-between">
              <h2 className="text-[22px] font-bold text-[#222]">
                Recently Launched
              </h2>
              <Link
                href="/shop"
                className="flex items-center gap-1 text-[13px] font-medium text-store-accent hover:underline"
              >
                View All
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {allProducts.slice(0, 10).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== POPULAR BRANDS ===== */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-10">
          <h2 className="mb-7 text-center text-[22px] font-bold text-[#222]">
            Popular Brands
          </h2>
          <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
            {["Apple", "Samsung", "Sony", "Google", "JBL", "Tesla"].map(
              (brand) => (
                <div
                  key={brand}
                  className="flex h-20 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 transition-shadow hover:shadow-md"
                >
                  <span className="text-[14px] font-semibold text-gray-400">
                    {brand}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="bg-store-accent">
        <div className="container mx-auto px-4 py-12 text-center md:py-16">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Ready to Start Shopping?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[13px] text-white/70">
            Browse our complete catalog and find exactly what you need. Fast
            delivery and great prices guaranteed.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-8 py-3 text-[13px] font-bold text-store-accent transition-colors hover:bg-gray-100"
          >
            Browse All Products
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ===== Product Card Component ===== */
function ProductCard({
  product,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    sellingPrice: number;
    comparePrice?: number | null;
    brand?: string | null;
    quantityInStock: number;
    images?: { url: string; altText?: string | null }[];
    category?: { name: string } | null;
  };
}) {
  const hasDiscount =
    product.comparePrice && product.comparePrice > product.sellingPrice;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.comparePrice! - product.sellingPrice) /
          product.comparePrice!) *
          100
      )
    : 0;

  return (
    <Link href={`/shop/${product.slug}`}>
      <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-[#f5f5f5]">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].altText || product.name}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Package className="size-12 text-gray-200" />
            </div>
          )}
          {hasDiscount && (
            <span className="absolute left-2.5 top-2.5 rounded border border-[#333] px-2 py-0.5 text-[11px] font-semibold text-[#333]">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="p-3.5">
          {product.category && (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {product.category.name}
            </p>
          )}
          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-[#222]">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[15px] font-bold text-store-accent">
              {formatCurrency(product.sellingPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[12px] text-gray-400 line-through">
                {formatCurrency(product.comparePrice!)}
              </span>
            )}
          </div>
          {product.quantityInStock <= 0 && (
            <span className="mt-2 inline-block rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
