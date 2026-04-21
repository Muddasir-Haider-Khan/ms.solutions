import Link from "next/link";
import {
  ChevronDown,
  Phone,
  Mail,
  MapPin,
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
import { getSocialLinks } from "@/actions/social-links";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, categoriesResult, socialLinksResult] = await Promise.all([
    getServerSession(authOptions),
    getStoreCategories().catch(() => ({ success: false as const, data: null })),
    getSocialLinks().catch(() => ({ success: false as const, data: [] })),
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

  const socialLinks = socialLinksResult.success ? socialLinksResult.data : [];

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
        {/* Main Header */}
        <header className="sticky top-0 z-50 w-full bg-[#1a1a1a] shadow-lg">
          <div className="container mx-auto flex h-[76px] items-center gap-6 px-4">
            {/* Mobile menu */}
            <MobileNav
              categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
              }))}
            />

            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#00796b]">
                <img src="/logo-icon.svg" alt="Multi Solutions" className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[17px] font-bold leading-tight tracking-tight text-white">
                  Multi Solutions
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
                  Electronics Store
                </span>
              </div>
            </Link>

            {/* Search bar - desktop, centered/flex-1 */}
            <div className="flex flex-1 justify-center">
              <HeaderSearch />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-1">
              <AuthButtons user={authUser} />
              <HeaderCartIndicator />
            </div>
          </div>
        </header>

        {/* Category Navigation Bar */}
        <nav className="hidden border-b border-gray-100 bg-white lg:block">
          <div className="container mx-auto flex items-center gap-0 px-4">
            <Link
              href="/shop"
              className="flex items-center gap-1.5 border-r border-gray-200 px-5 py-4 text-[13px] font-bold uppercase tracking-widest text-[#1a1a1a] transition-colors hover:text-[#00796b]"
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
                  className="relative px-4 py-4 text-[14px] font-medium text-[#555] transition-colors hover:text-[#00796b] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#00796b] after:transition-all after:duration-200 hover:after:w-full"
                >
                  {cat.name}
                </Link>
              ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer style={{ backgroundColor: "#111111" }} className="relative overflow-hidden">

          {/* Subtle grid texture */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />

          {/* Newsletter band */}
          <div style={{ backgroundColor: "#00796b" }}>
            <div className="container mx-auto px-4 py-10">
              <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Stay in the loop</p>
                  <h3 className="mt-1 text-[22px] font-bold text-white">Get the best deals delivered to your inbox</h3>
                </div>
                <form className="flex w-full max-w-md shrink-0 overflow-hidden rounded-xl shadow-lg" action="#">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="h-12 flex-1 border-0 bg-white px-5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-12 bg-[#0d0d0d] px-6 text-[13px] font-bold text-white transition-colors hover:bg-[#222]"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Main footer body */}
          <div className="container mx-auto px-4 pt-14 pb-10">
            <div className="grid gap-10 md:grid-cols-12">

              {/* Brand column */}
              <div className="md:col-span-4 space-y-5">
                <Link href="/" className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#00796b]">
                    <img src="/logo-icon.svg" alt="Multi Solutions" className="size-6" />
                  </div>
                  <div>
                    <p className="text-[19px] font-bold leading-tight text-white">Multi Solutions</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Electronics Store</p>
                  </div>
                </Link>

                <p className="text-[14px] leading-[1.85] text-white/65">
                  Your one-stop destination for premium electronics and gadgets.
                  Quality products, competitive prices, and fast nationwide delivery — since 2020.
                </p>

                {/* Social links */}
                <div className="flex items-center gap-2.5 pt-1">
                  {socialLinks.length > 0 ? socialLinks.map((link) => {
                    const icons: Record<string, React.ReactNode> = {
                      facebook:  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>,
                      instagram: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>,
                      twitter:   <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>,
                      youtube:   <><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></>,
                    };
                    return (
                      <a
                        key={link.platform}
                        href={link.url || "#"}
                        target={link.url ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        aria-label={link.platform}
                        className="group flex size-9 items-center justify-center rounded-lg border border-white/15 bg-white/8 transition-all hover:border-[#00796b] hover:bg-[#00796b]"
                      >
                        <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-white/60 stroke-2 transition-colors group-hover:stroke-white" strokeLinecap="round" strokeLinejoin="round">
                          {icons[link.platform]}
                        </svg>
                      </a>
                    );
                  }) : [
                    { label: "Facebook",  icon: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/> },
                    { label: "Instagram", icon: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></> },
                    { label: "Twitter",   icon: <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/> },
                    { label: "YouTube",   icon: <><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></> },
                  ].map(({ label, icon }) => (
                    <a
                      key={label}
                      href="#"
                      aria-label={label}
                      className="group flex size-9 items-center justify-center rounded-lg border border-white/15 bg-white/8 transition-all hover:border-[#00796b] hover:bg-[#00796b]"
                    >
                      <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-white/60 stroke-2 transition-colors group-hover:stroke-white" strokeLinecap="round" strokeLinejoin="round">
                        {icon}
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              {/* Spacer */}
              <div className="hidden md:block md:col-span-1" />

              {/* Categories */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00796b]">Categories</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/shop" className="group flex items-center gap-2.5 text-[14px] text-white/60 transition-colors hover:text-white">
                      <span className="size-1.5 rounded-full bg-[#00796b]/50 transition-colors group-hover:bg-[#00796b]" />
                      All Products
                    </Link>
                  </li>
                  {categories.slice(0, 7).map((cat) => (
                    <li key={cat.id}>
                      <Link href={`/shop?category=${cat.id}`} className="group flex items-center gap-2.5 text-[14px] text-white/60 transition-colors hover:text-white">
                        <span className="size-1.5 rounded-full bg-[#00796b]/50 transition-colors group-hover:bg-[#00796b]" />
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick links */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00796b]">Quick Links</h4>
                <ul className="space-y-3">
                  {[
                    { label: "Home",          href: "/" },
                    { label: "Shop",          href: "/shop" },
                    { label: "Blog",          href: "/blog" },
                    { label: "Track Order",   href: "/account/orders" },
                    { label: "My Account",    href: "/account" },
                    { label: "FAQ",           href: "/faq" },
                    { label: "Privacy Policy",href: "/privacy-policy" },
                  ].map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="group flex items-center gap-2.5 text-[14px] text-white/60 transition-colors hover:text-white">
                        <span className="size-1.5 rounded-full bg-[#00796b]/50 transition-colors group-hover:bg-[#00796b]" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div className="md:col-span-3 space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00796b]">Get in Touch</h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/8 border border-white/10">
                      <Phone className="size-4 text-[#00796b]" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Phone</p>
                      <p className="mt-0.5 text-[14px] font-medium text-white/80">+92 300 1234567</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/8 border border-white/10">
                      <Mail className="size-4 text-[#00796b]" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Email</p>
                      <p className="mt-0.5 text-[14px] font-medium text-white/80">info@multisolutions.com</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/8 border border-white/10">
                      <MapPin className="size-4 text-[#00796b]" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Location</p>
                      <p className="mt-0.5 text-[14px] font-medium text-white/80">Nationwide Delivery, Pakistan</p>
                    </div>
                  </li>
                </ul>
              </div>

            </div>

            {/* Divider */}
            <div className="my-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* Bottom bar */}
            <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
              <p className="text-[13px] text-white/40">
                &copy; {new Date().getFullYear()} Multi Solutions Store. All rights reserved.
              </p>

              {/* Payment method icons — soft, unified style */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {/* Visa */}
                <span
                  className="flex h-7 items-center rounded-md px-2.5"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <svg viewBox="0 0 780 500" className="h-[13px] w-auto" aria-label="Visa">
                    <path fill="rgba(255,255,255,0.85)" d="M293.2 348.7l33.36-195.7h53.36l-33.36 195.7H293.2zm246.7-191c-10.57-3.96-27.18-8.2-47.9-8.2-52.78 0-89.97 26.6-90.26 64.72-.3 28.17 26.6 43.87 46.9 53.24 20.84 9.6 27.85 15.73 27.75 24.28-.12 13.12-16.64 19.1-32.02 19.1-21.4 0-32.78-2.98-50.32-10.32l-6.9-3.12-7.5 43.9c12.47 5.44 35.53 10.17 59.5 10.4 56.12 0 92.56-26.3 92.97-67.04.2-22.33-14.07-39.3-44.96-53.3-18.73-9.07-30.2-15.13-30.08-24.3 0-8.13 9.7-16.82 30.67-16.82 17.5-.27 30.17 3.54 40.04 7.5l4.8 2.26 7.26-42.3"/>
                    <path fill="rgba(255,255,255,0.85)" d="M633 153h-41.3c-12.8 0-22.34 3.5-27.96 16.34l-79.3 179.4h56.08s9.17-24.1 11.24-29.4h68.54c1.6 6.85 6.5 29.4 6.5 29.4h49.56L633 153zm-65.7 125c4.43-11.3 21.35-54.9 21.35-54.9-.3.5 4.4-11.4 7.1-18.8l3.63 17s10.27 47.1 12.4 56.7H567.3z"/>
                    <path fill="rgba(255,255,255,0.85)" d="M237.4 153l-52.27 133.4-5.57-27.14c-9.7-31.26-40-65.1-73.86-82.1l47.8 171h56.5l84.1-195.2H237.4z"/>
                    <path fill="rgba(255,200,100,0.85)" d="M134.8 153H47.92l-.7 4.02c67.16 16.3 111.6 55.7 130 102.9L158.1 169.5c-3.47-12.55-13.56-16.1-23.3-16.5z"/>
                  </svg>
                </span>
                {/* Mastercard */}
                <span
                  className="flex h-7 items-center gap-1 rounded-md px-2.5"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <span className="size-3.5 rounded-full opacity-80" style={{ background: "#eb001b", display: "inline-block" }} />
                  <span className="-ml-2 size-3.5 rounded-full opacity-80" style={{ background: "#f79e1b", display: "inline-block" }} />
                  <span className="ml-1 text-[11px] font-semibold text-white/70">MC</span>
                </span>
                {/* JazzCash */}
                <span
                  className="flex h-7 items-center gap-1 rounded-md px-2.5"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <span className="text-[11px] font-bold text-white/85">Jazz</span>
                  <span className="text-[11px] font-bold" style={{ color: "rgba(255,200,60,0.9)" }}>Cash</span>
                </span>
                {/* EasyPaisa */}
                <span
                  className="flex h-7 items-center gap-1 rounded-md px-2.5"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <span className="text-[11px] font-bold text-white/85">Easy</span>
                  <span className="text-[11px] font-bold" style={{ color: "rgba(100,220,160,0.9)" }}>Paisa</span>
                </span>
                {/* COD */}
                <span
                  className="flex h-7 items-center gap-1.5 rounded-md px-2.5"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <svg viewBox="0 0 24 24" className="size-3 text-white/60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                  </svg>
                  <span className="text-[11px] font-semibold text-white/70">COD</span>
                </span>
              </div>
            </div>
          </div>

        </footer>
        <Toaster richColors position="top-right" />
      </div>
    </GuestCartProvider>
  );
}
