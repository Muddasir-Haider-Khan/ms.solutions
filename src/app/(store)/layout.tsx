import Link from "next/link";
import {
  Package,
  Phone,
  Mail,
  MapPin,
  LayoutDashboard,
  Globe,
  ExternalLink,
  Search,
  ChevronDown,
  Tag,
  Truck,
  Shield,
  CreditCard,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthButtons } from "@/components/store/auth-buttons";
import { GuestCartProvider } from "@/lib/guest-cart";
import { HeaderSearch } from "@/components/store/header-search";
import { HeaderCartIndicator } from "@/components/store/header-cart-indicator";
import { MobileNav } from "@/components/store/mobile-nav";
import { getStoreCategories } from "@/actions/store";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, categoriesResult] = await Promise.all([
    getServerSession(authOptions),
    getStoreCategories().catch(() => ({ success: false as const, data: null })),
  ]);
  const isAdmin =
    session?.user &&
    ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(
      (session.user as any).role
    );

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : [];

  const authUser = session?.user
    ? {
        name: session.user.name || "Customer",
        email: session.user.email || "",
        role: (session.user as { role: string }).role || "CUSTOMER",
      }
    : null;

  return (
    <GuestCartProvider>
      <div className="flex min-h-screen flex-col bg-white" style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>
        {/* Top utility bar */}
        <div className="border-b border-gray-100 bg-white">
          <div className="container mx-auto flex items-center justify-between px-4 py-1.5 text-[12px] text-gray-500">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <Phone className="size-3" />
                +92 300 1234567
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <Mail className="size-3" />
                info@multisolutions.com
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3" />
                Nationwide Delivery
              </span>
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1 text-[12px] font-medium text-store-accent hover:underline"
                >
                  <LayoutDashboard className="size-3" />
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <header className="sticky top-0 z-50 w-full bg-[#222222] shadow-md">
          <div className="container mx-auto flex h-[64px] items-center justify-between gap-4 px-4">
            {/* Mobile menu */}
            <MobileNav
              categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
              }))}
            />

            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-store-accent">
                <Package className="size-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[18px] font-bold leading-tight text-white">
                  Multi Solutions
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/50">
                  Store
                </span>
              </div>
            </Link>

            {/* Search bar - desktop */}
            <HeaderSearch />

            {/* Right side actions */}
            <div className="flex items-center gap-1">
              <AuthButtons user={authUser} />
              <HeaderCartIndicator />
            </div>
          </div>
        </header>

        {/* Category Navigation Bar */}
        <nav className="hidden border-b border-gray-200 bg-white lg:block">
          <div className="container mx-auto flex items-center gap-0 px-4 py-0">
            {/* All Categories dropdown style */}
            <Link
              href="/shop"
              className="flex items-center gap-1.5 border-r border-gray-200 px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#222222] transition-colors hover:text-store-accent"
            >
              All Products
              <ChevronDown className="size-3.5" />
            </Link>
            {categories
              .filter((cat) => cat._count.products > 0)
              .slice(0, 10)
              .map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.id}`}
                  className="px-3.5 py-3 text-[13px] font-medium text-[#555555] transition-colors hover:text-store-accent"
                >
                  {cat.name}
                </Link>
              ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Pre-footer CTA banner */}
        <section className="bg-[#222222]">
          <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row">
            <div>
              <p className="text-sm text-gray-400">
                Didn&apos;t find anything interesting?
              </p>
              <p className="text-sm text-gray-400">
                Perhaps you will find something among our promotions!
              </p>
            </div>
            <Link
              href="/shop"
              className="rounded-md bg-store-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover"
            >
              All Promotions
            </Link>
          </div>
        </section>

        {/* Newsletter Band */}
        <section className="bg-store-accent">
          <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h3 className="text-lg font-bold text-white">
                Get the most interesting offers first to you!
              </h3>
            </div>
            <form className="flex w-full max-w-md" action="#">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-12 flex-1 rounded-l-md border-0 px-5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-r-md bg-[#222222] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#333333]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#222222] text-gray-400">
          <div className="container mx-auto px-4 py-12">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {/* Company info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-store-accent">
                    <Package className="size-5 text-white" />
                  </div>
                  <span className="text-[16px] font-bold text-white">
                    Multi Solutions
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-gray-500">
                  Your one-stop shop for quality electronics and gadgets at
                  competitive prices. Serving customers nationwide with
                  reliable service and fast delivery.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="#"
                    className="flex size-8 items-center justify-center rounded-full bg-white/10 text-gray-400 transition-colors hover:bg-store-accent hover:text-white"
                  >
                    <Globe className="size-4" />
                  </a>
                  <a
                    href="#"
                    className="flex size-8 items-center justify-center rounded-full bg-white/10 text-gray-400 transition-colors hover:bg-store-accent hover:text-white"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <h4 className="text-[14px] font-semibold text-white">
                  Categories
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/shop"
                      className="text-[13px] text-gray-500 transition-colors hover:text-store-accent"
                    >
                      All Categories
                    </Link>
                  </li>
                  {categories.slice(0, 6).map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/shop?category=${cat.id}`}
                        className="text-[13px] text-gray-500 transition-colors hover:text-store-accent"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick links */}
              <div className="space-y-3">
                <h4 className="text-[14px] font-semibold text-white">
                  Find us
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/"
                      className="text-[13px] text-gray-500 transition-colors hover:text-store-accent"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/shop"
                      className="text-[13px] text-gray-500 transition-colors hover:text-store-accent"
                    >
                      Shop All Products
                    </Link>
                  </li>
                  <li>
                    <span className="text-[13px] text-gray-500">Blog</span>
                  </li>
                  <li>
                    <span className="text-[13px] text-gray-500">FAQ</span>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div className="space-y-3">
                <h4 className="text-[14px] font-semibold text-white">
                  Contact Us
                </h4>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Phone className="size-3.5 shrink-0 text-store-accent" />
                    +92 300 1234567
                  </li>
                  <li className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Mail className="size-3.5 shrink-0 text-store-accent" />
                    info@multisolutions.com
                  </li>
                  <li className="flex items-start gap-2 text-[13px] text-gray-500">
                    <MapPin className="size-3.5 shrink-0 text-store-accent" />
                    Nationwide Delivery, Pakistan
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-10 border-t border-white/10 pt-6">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-[12px] text-gray-600">
                  &copy; {new Date().getFullYear()} Multi Solutions Store. All
                  rights reserved.
                </p>
                <div className="flex items-center gap-3 text-[10px] font-medium text-gray-600">
                  <span className="rounded border border-white/20 px-2 py-0.5">
                    VISA
                  </span>
                  <span className="rounded border border-white/20 px-2 py-0.5">
                    MasterCard
                  </span>
                  <span className="rounded border border-white/20 px-2 py-0.5">
                    JazzCash
                  </span>
                  <span className="rounded border border-white/20 px-2 py-0.5">
                    EasyPaisa
                  </span>
                  <span className="rounded border border-white/20 px-2 py-0.5">
                    COD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>

        <Toaster richColors position="top-right" />
      </div>
    </GuestCartProvider>
  );
}
