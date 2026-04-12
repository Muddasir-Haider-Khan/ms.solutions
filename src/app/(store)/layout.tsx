import Link from "next/link";
import { Package, ShoppingCart, Menu, X, User, Phone, Mail, MapPin, LayoutDashboard } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user && ["SUPER_ADMIN", "ADMIN", "STAFF"].includes((session.user as any).role);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top announcement bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center justify-center gap-6 px-4 py-1.5 text-xs">
          <span className="flex items-center gap-1">
            <Phone className="size-3" />
            +92 300 1234567
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Mail className="size-3" />
            info@multisolutions.com
          </span>
          <span className="hidden md:flex items-center gap-1">
            <MapPin className="size-3" />
            Nationwide Delivery
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <Package className="size-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-tight">
                Multi Solutions
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Store
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/shop"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Shop
            </Link>
            <Link
              href="/cart"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cart
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ShoppingCart className="size-5" />
            </Link>
            {isAdmin && (
              <Link
                href="/dashboard"
                className="hidden sm:flex h-8 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <LayoutDashboard className="size-3.5" />
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Company info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                  <Package className="size-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-bold">Multi Solutions Store</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Your one-stop shop for quality products at competitive prices.
                Serving customers nationwide with reliable service.
              </p>
            </div>

            {/* Quick links */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Shop All Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cart"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Shopping Cart
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Contact Us</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="size-3" />
                  +92 300 1234567
                </li>
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="size-3" />
                  info@multisolutions.com
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Policies</h4>
              <ul className="space-y-2">
                <li>
                  <span className="text-xs text-muted-foreground">
                    Shipping & Delivery
                  </span>
                </li>
                <li>
                  <span className="text-xs text-muted-foreground">
                    Return Policy
                  </span>
                </li>
                <li>
                  <span className="text-xs text-muted-foreground">
                    Privacy Policy
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t pt-6">
            <p className="text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Multi Solutions Store. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  );
}
