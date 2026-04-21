import Link from "next/link";
import {
  ArrowRight,
  Package,
  Truck,
  CreditCard,
  Store,
  Tag,
  ShieldCheck,
  Info,
  Zap,
  Gift,
  Clock,
} from "lucide-react";
import { getStoreProducts, getStoreCategories, getDealsProducts } from "@/actions/store";
import { getBanners } from "@/actions/banners";
import { getHeroCards } from "@/actions/hero-cards";
import { getPublishedArticles } from "@/actions/articles";
import { getStoreBrands } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";
import { CategoryCarousel } from "./_components/CategoryCarousel";
import { PromoSlider } from "./_components/PromoSlider";
import { HoverProductCard } from "./_components/HoverProductCard";
import { DealProductCard } from "./_components/DealProductCard";
import { ArticleImage } from "./_components/ArticleImage";
import { NewArrivalsCarousel } from "./_components/NewArrivalsCarousel";

export const metadata = {
  title: "Multi Solutions Store — Electronic Mega Market",
  description: "Shop quality electronics & gadgets at competitive prices. Fast delivery nationwide.",
};

export default async function StoreHomePage() {
  const [featuredResult, allProductsResult, categoriesResult, dealsResult, bannersResult, heroCardsResult, articlesResult, brandsResult] =
    await Promise.all([
      getStoreProducts({ featured: true, limit: 10 }),
      getStoreProducts({ limit: 8, sort: "newest" }),
      getStoreCategories(),
      getDealsProducts(4),
      getBanners(),
      getHeroCards(),
      getPublishedArticles(4),
      getStoreBrands(),
    ]);

  const featuredProducts = featuredResult.success && featuredResult.data ? featuredResult.data.products : [];
  const allProducts = allProductsResult.success && allProductsResult.data ? allProductsResult.data.products : [];
  const categories = categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];
  const dealsProducts = dealsResult.success && dealsResult.data ? dealsResult.data : [];
  const banners = bannersResult.success && bannersResult.data ? bannersResult.data : [];
  const heroCards = heroCardsResult.success && heroCardsResult.data ? heroCardsResult.data : [];
  const articles = articlesResult.success && articlesResult.data ? articlesResult.data : [];
  const brands = brandsResult.success && brandsResult.data ? brandsResult.data : [];

  const activeCategories = categories.filter((c) => c._count.products > 0);

  // Helper: get hero card by slot with fallback defaults
  function getHero(slot: number) {
    return heroCards.find((c) => c.slot === slot) ?? null;
  }

  const hero1 = getHero(1);
  const hero2 = getHero(2);
  const hero3 = getHero(3);
  const hero4 = getHero(4);

  return (
    <div className="flex flex-col">

      {/* ── HERO BANNER GRID ─────────────────────────────────────────── */}
      <section className="bg-[#f0f0f0]">
        <div className="container mx-auto px-4 py-5">
          <div className="grid gap-3 md:grid-cols-3 md:grid-rows-2" style={{ minHeight: "480px" }}>

            {/* Large left card (slot 1) */}
            <div
              className="relative md:col-span-2 md:row-span-2 overflow-hidden rounded-2xl"
              style={{ backgroundColor: hero1?.bgColor ?? "#1a1a1a" }}
            >
              {hero1?.imageUrl && (
                <img src={hero1.imageUrl} alt={hero1.title} className="absolute inset-0 size-full object-cover opacity-60" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-end p-8 md:p-12">
                <h2 className="text-[28px] md:text-[42px] font-bold text-white leading-tight tracking-tight">
                  {hero1?.title ?? "Sony 5G Headphone"}
                </h2>
                {(hero1?.subtitle ?? "Only Music. Nothing Else.") && (
                  <p className="mt-2 text-[14px] text-white/60">{hero1?.subtitle ?? "Only Music. Nothing Else."}</p>
                )}
                <div className="mt-6">
                  <Link
                    href={hero1?.linkUrl ?? "/shop"}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#00796b] px-7 py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-white hover:text-[#00796b]"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>

            {/* Top-right (slot 2) */}
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{ backgroundColor: hero2?.bgColor ?? "#00796b" }}
            >
              {hero2?.imageUrl && (
                <img src={hero2.imageUrl} alt={hero2.title} className="absolute inset-0 size-full object-cover opacity-50" />
              )}
              <div className="relative z-10 flex h-full flex-col p-6">
                <h2 className="text-[20px] font-bold text-white leading-snug">{hero2?.title ?? "Air Mavic 3"}</h2>
                <p className="mt-1 text-[13px] text-white/75">{hero2?.subtitle ?? "As powerful as it is portable"}</p>
                <div className="mt-4">
                  <Link
                    href={hero2?.linkUrl ?? "/shop"}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#111] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#333]"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom-right two small cards (slot 3 & 4) */}
            <div className="grid grid-cols-2 gap-3">
              {[hero3, hero4].map((h, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl p-5 flex flex-col justify-between relative"
                  style={{ backgroundColor: h?.bgColor ?? "#e8ecef" }}
                >
                  {h?.imageUrl && (
                    <img src={h.imageUrl} alt={h.title} className="absolute inset-0 size-full object-cover opacity-30" />
                  )}
                  <div className="relative z-10">
                    <h3 className="text-[15px] font-bold text-[#111]">{h?.title ?? (idx === 0 ? "Handheld" : "Gearbox")}</h3>
                    <p className="mt-0.5 text-[12px] text-[#666]">{h?.subtitle ?? (idx === 0 ? "USB 3 Rechargeable" : "Upto 30% Discount")}</p>
                  </div>
                  <Link
                    href={h?.linkUrl ?? "/shop"}
                    className="relative z-10 mt-3 inline-flex items-center text-[13px] font-semibold text-[#111] hover:text-[#00796b] transition-colors"
                  >
                    Shop Now →
                  </Link>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── BENEFITS BAR ─────────────────────────────────────────────── */}
      <section className="border-b border-gray-200 bg-white">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-5 md:grid-cols-5">
          {[
            { icon: Tag,        text: <>Log in <span className="font-semibold text-[#00796b]">get up to 50% discounts</span></> },
            { icon: Store,      text: "Open new stores in your city" },
            { icon: Truck,      text: "Free fast express delivery with tracking" },
            { icon: ShieldCheck,text: "Equipment loose and damage insurance" },
            { icon: CreditCard, text: "Installment without overpayments" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <item.icon className="size-5 shrink-0 text-[#00796b]" />
              <p className="text-[13px] leading-snug text-[#555]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── POPULAR CATEGORIES ───────────────────────────────────────── */}
      {activeCategories.length > 0 && (
        <section className="bg-white">
          <div className="container mx-auto px-8 py-12">
            <h2 className="mb-8 text-center text-[24px] font-bold text-[#1a1a1a] tracking-tight">
              Popular Categories
            </h2>
            <CategoryCarousel categories={activeCategories} />
          </div>
        </section>
      )}

      {/* ── NEW ARRIVAL PRODUCTS ─────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="border-t border-gray-100 bg-[#fafafa]">
          <div className="container mx-auto px-8 py-12">
            <h2 className="mb-8 text-center text-[24px] font-bold text-[#1a1a1a] tracking-tight">
              New Arrival Products
            </h2>
            <NewArrivalsCarousel products={featuredProducts} />
          </div>
        </section>
      )}

      {/* ── PROMO SLIDER (dynamic from admin) ───────────────────────── */}
      <section className="bg-[#f0f0f0]">
        <div className="container mx-auto px-4 py-6">
          <PromoSlider banners={banners} />
        </div>
      </section>

      {/* ── OUR ADVANTAGES ──────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <h2 className="mb-8 text-center text-[24px] font-bold text-[#1a1a1a] tracking-tight">
            Our Advantages
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: CreditCard,  title: "Fee-Free Installment",       desc: "0% markup payment plans" },
              { icon: ShieldCheck, title: "Best Price Guarantee",       desc: "Match any lower price" },
              { icon: Gift,        title: "Loyalty Bonus Program",      desc: "Earn points on every order" },
              { icon: Clock,       title: "Pickup in 15 Minutes",       desc: "In-store express pickup" },
              { icon: Truck,       title: "Convenient Delivery",        desc: "Nationwide door delivery" },
              { icon: Zap,         title: "Same-Day Service",           desc: "Repairs & tech support" },
              { icon: Truck,       title: "Express 2-Hour Delivery",    desc: "Within city limits" },
              { icon: Package,     title: "Equipment Acceptance",       desc: "We buy used devices" },
            ].map((item) => (
              <div
                key={item.title}
                className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-[#00796b]/30 hover:shadow-md"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e0f2f1]">
                  <item.icon className="size-5 text-[#00796b]" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1a1a1a] leading-snug">{item.title}</p>
                  <p className="mt-0.5 text-[12px] text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEALS OF THE DAY + SIDE PROMOS ──────────────────────────── */}
      <section className="bg-[#f0f0f0]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-4 md:grid-cols-5">

            {/* Left — deals box */}
            <div className="md:col-span-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-[#1a1a1a] tracking-tight">Deals Of The Day</h2>
                <Link href="/shop" className="flex items-center gap-1 text-[13px] font-semibold text-[#00796b] hover:underline">
                  View All <ArrowRight className="size-3.5" />
                </Link>
              </div>

              {dealsProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {dealsProducts.map((product) => (
                    <DealProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-[13px] text-blue-700">
                  <Info className="size-4 shrink-0" />
                  No deals right now. Check back soon!
                </div>
              )}
            </div>

            {/* Right — promo tiles */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <div className="relative flex-1 overflow-hidden rounded-2xl bg-[#d4e8e4]" style={{ minHeight: "200px" }}>
                <div className="p-6">
                  <h3 className="text-[26px] font-bold text-[#111] leading-tight">Headphones</h3>
                  <p className="mt-1 text-[13px] text-[#555]">Integrated Control and Mode</p>
                  <Link
                    href="/shop?category=audio"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#00796b] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#111]"
                  >
                    See Category
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="overflow-hidden rounded-2xl bg-[#1a1a2e] p-5">
                  <h4 className="text-[15px] font-bold text-white leading-snug">Wireless Charger</h4>
                  <p className="mt-1 text-[11px] text-white/60">QI-Certified Fast Charging</p>
                  <Link href="/shop" className="mt-3 inline-flex items-center justify-center rounded-xl border border-white/50 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white hover:text-[#111] transition-colors">
                    See More
                  </Link>
                </div>
                <div className="overflow-hidden rounded-2xl bg-[#2d2d2d] p-5">
                  <h4 className="text-[15px] font-bold text-white leading-snug">Protection Cover</h4>
                  <p className="mt-1 text-[11px] text-white/60">Premium Transparent Hybrid</p>
                  <Link href="/shop" className="mt-3 inline-flex items-center justify-center rounded-xl border border-white/50 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white hover:text-[#111] transition-colors">
                    See More
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── RECENTLY LAUNCHED ────────────────────────────────────────── */}
      {allProducts.length > 0 && (
        <section className="bg-[#f8f8f8]">
          <div className="container mx-auto px-4 py-12">
            <h2 className="mb-8 text-center text-[24px] font-bold text-[#1a1a1a] tracking-tight">
              Recently Launched
            </h2>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="grid md:grid-cols-3">

                {/* Left panel */}
                <div className="border-b border-gray-200 md:border-b-0 md:border-r">
                  <div className="relative overflow-hidden bg-[#111] p-8 text-white" style={{ minHeight: "230px" }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00796b]/40 to-transparent" />
                    <div className="relative z-10">
                      <h3 className="text-[24px] font-bold leading-tight">Virtual Reality</h3>
                      <p className="mt-2 text-[13px] text-white/60">Gear VR Immersive Viewing Goggles</p>
                      <Link
                        href="/shop"
                        className="mt-5 inline-flex items-center gap-1 rounded-xl bg-[#00796b] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-white hover:text-[#00796b] transition-colors"
                      >
                        Shop Now
                      </Link>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {activeCategories.slice(0, 10).map((cat, i) => (
                        <Link
                          key={cat.id}
                          href={`/shop?category=${cat.id}`}
                          className={`text-[13px] font-medium transition-colors hover:text-[#00796b] ${
                            i % 3 === 1 ? "text-[#00796b]" : "text-[#444]"
                          }`}
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right — product grid */}
                <div className="md:col-span-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4">
                    {allProducts.slice(0, 8).map((product) => (
                      <HoverProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>

              </div>
            </div>
            
            <div className="mt-16 text-center">
                <Button
                  variant="outline"
                  className="rounded-full px-8 py-6 text-sm font-medium"
                  render={<Link href="/shop" />}
                  nativeButton={false}
                >
                  View all categories
                </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── POPULAR BRANDS ───────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <h2 className="mb-8 text-center text-[24px] font-bold text-[#1a1a1a] tracking-tight">
            Popular Brands
          </h2>
          {brands.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
              {brands.slice(0, 10).map((brand) => (
                <a
                  key={brand}
                  href={`/shop?brand=${encodeURIComponent(brand)}`}
                  className="group flex h-[68px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 transition-all duration-300 hover:border-[#00796b]/40 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span className="text-[15px] font-bold tracking-tight text-gray-400 transition-colors group-hover:text-[#1a1a1a]">
                    {brand}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
              {[
                { name: "amazon",   color: "#FF9900" },
                { name: "AMD",      color: "#ED1C24" },
                { name: "facebook", color: "#1877F2" },
                { name: "logitech", color: "#00B5E2" },
                { name: "apper",    color: "#555555" },
                { name: "hooli",    color: "#333333" },
                { name: "FedEx",    color: "#660099" },
                { name: "PayPal",   color: "#003087" },
                { name: "NETFLIX",  color: "#E50914" },
                { name: "Spotify",  color: "#1DB954" },
              ].map(({ name, color }) => (
                <div
                  key={name}
                  className="group flex h-[68px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 transition-all duration-300 hover:border-[#00796b]/40 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                >
                  <span className="text-[15px] font-bold tracking-tight text-gray-400 transition-colors group-hover:text-[#1a1a1a]" style={{ color: `${color}80` }}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FROM OUR ARTICLES ────────────────────────────────────────── */}
      <section className="bg-[#f5f5f5]">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-[24px] font-bold text-[#1a1a1a] tracking-tight">From Our Articles</h2>
            <Link href="/blog" className="flex items-center gap-1 text-[13px] font-semibold text-[#00796b] hover:underline">
              All Articles <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {articles.length > 0
              ? articles.map((article) => {
                  const date = article.publishedAt ? new Date(article.publishedAt) : new Date(article.createdAt);
                  return (
                    <Link key={article.id} href={`/blog/${article.slug}`} className="group">
                      <div className="overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-lg transition-shadow">
                        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                          {article.coverImage ? (
                            <ArticleImage src={article.coverImage} alt={article.title} />
                          ) : (
                            <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#00796b]/10 to-[#00796b]/30">
                              <span className="text-5xl font-bold text-[#00796b]/30">{article.title.charAt(0)}</span>
                            </div>
                          )}
                          <div className="absolute left-3 top-3 flex size-12 flex-col items-center justify-center rounded-full bg-white shadow text-center">
                            <span className="text-[14px] font-bold leading-none text-[#222]">{date.getDate().toString().padStart(2, "0")}</span>
                            <span className="text-[9px] font-semibold uppercase text-[#00796b]">
                              {date.toLocaleString("default", { month: "short" })}
                            </span>
                          </div>
                          {article.category && (
                            <div className="absolute bottom-3 left-3">
                              <span className="rounded bg-[#00796b] px-2 py-0.5 text-[10px] font-semibold text-white">
                                {article.category}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="text-[14px] font-semibold text-[#222] group-hover:text-[#00796b] leading-snug transition-colors line-clamp-2">
                            {article.title}
                          </h4>
                          {article.excerpt && (
                            <p className="mt-1.5 line-clamp-2 text-[12px] text-[#888]">{article.excerpt}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })
              : STATIC_ARTICLES.map((article) => (
                  <div key={article.title} className="group overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-lg transition-shadow">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <ArticleImage src={article.image} alt={article.title} />
                      <div className="absolute left-3 top-3 flex size-12 flex-col items-center justify-center rounded-full bg-white shadow text-center">
                        <span className="text-[14px] font-bold leading-none text-[#222]">{article.day}</span>
                        <span className="text-[9px] font-semibold uppercase text-[#00796b]">{article.month}</span>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <span className="rounded bg-[#00796b] px-2 py-0.5 text-[10px] font-semibold text-white">
                          {article.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-[14px] font-semibold text-[#222] group-hover:text-[#00796b] leading-snug transition-colors">
                        {article.title}
                      </h4>
                      <p className="mt-1.5 line-clamp-2 text-[12px] text-[#888]">{article.excerpt}</p>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ── CTA — TWO HALVES ─────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-4 md:grid-cols-2">

            {/* Left — promotions */}
            <div className="relative overflow-hidden rounded-2xl bg-[#f0f4f3] px-8 py-10">
              {/* Decorative megaphone */}
              <div className="absolute right-6 bottom-0 opacity-[0.07]">
                <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-[#00796b]">
                  <path d="M3 11v2M18 4v16M5 7H3a2 2 0 00-2 2v2a2 2 0 002 2h2l4 4V3L5 7z"/>
                  <path d="M15.54 8.46a5 5 0 010 7.07M18 5a9 9 0 010 14"/>
                </svg>
              </div>
              <div className="absolute right-4 bottom-4 opacity-10">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" className="text-[#00796b]">
                  <path d="M18 4v16L5 15H3a2 2 0 01-2-2v-2a2 2 0 012-2h2L18 4z"/>
                  <path d="M15.54 8.46a5 5 0 010 7.07" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="relative z-10">
                <h3 className="text-[22px] font-bold leading-snug text-[#1a1a1a]">
                  Didn&apos;t Find Anything<br />Interesting?
                </h3>
                <p className="mt-2.5 max-w-xs text-[13px] leading-relaxed text-[#777]">
                  Perhaps you will find something among our promotions!
                </p>
                <Link
                  href="/shop"
                  className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-bold text-[#00796b] hover:underline"
                >
                  All Promotions
                </Link>
              </div>
            </div>

            {/* Right — newsletter / notification */}
            <div className="relative overflow-hidden rounded-2xl bg-[#eef6f5] px-8 py-10">
              {/* Decorative envelope + bell */}
              <div className="absolute right-4 bottom-2 flex items-end gap-2 opacity-10">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor" className="text-[#00796b]">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <div className="absolute right-2 top-4 opacity-15">
                <div className="relative">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor" className="text-[#00796b]">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                  </svg>
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#00796b] text-[10px] font-bold text-white">1</span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-[22px] font-bold leading-snug text-[#1a1a1a]">
                  Get the Most Interesting<br />Offers First to You!
                </h3>
                <p className="mt-2.5 max-w-xs text-[13px] leading-relaxed text-[#777]">
                  Subscribe and never miss a deal or new arrival.
                </p>
                <Link
                  href="/shop"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#00796b] px-6 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#005f56]"
                >
                  Browse All Products <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}

// Static fallback articles shown before any articles are created in admin
const STATIC_ARTICLES = [
  { day: "02", month: "JAN", category: "Audio Electronics", title: "Announcing the new Fitbits Charge", excerpt: "Recently, I was invited by Nintendo of Canada to attend a very special Nintendo Holiday Showcase", image: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=600&h=400&fit=crop&auto=format&q=80" },
  { day: "14", month: "FEB", category: "Audio Electronics", title: "Your Conversion Rate on Amazon", excerpt: "Recently, I was invited by Nintendo of Canada to attend a very special Nintendo Holiday Showcase", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop&auto=format&q=80" },
  { day: "14", month: "MAR", category: "Audio Electronics", title: "Success Story on Amazon", excerpt: "Recently, I was invited by Nintendo of Canada to attend a very special Nintendo Holiday Showcase", image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=600&h=400&fit=crop&auto=format&q=80" },
  { day: "08", month: "APR", category: "Audio Electronics", title: "13 YouTube Ads Targeting Options", excerpt: "Recently, I was invited by Nintendo of Canada to attend a very special Nintendo Holiday Showcase", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop&auto=format&q=80" },
];
