import Link from "next/link";
import { CartDrawer } from "@/components/store/cart-drawer";
import { Search, ShoppingBag, User, Menu } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthButtons } from "@/components/store/auth-buttons";
import { GuestCartProvider } from "@/lib/guest-cart";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  let isAdmin = false;
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    isAdmin = ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role);
  }

  const authUser = session?.user
    ? {
        name: session.user.name || "Customer",
        email: session.user.email || "",
        role: (session.user as { role: string }).role || "CUSTOMER",
      }
    : null;

  return (
    <GuestCartProvider>
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      {/* Apple-Style Global Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
              <img src="/images/logo.png" alt="MS Solutions" className="h-8 w-auto object-contain drop-shadow-sm" />
            </Link>
            
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="/shop" className="hover:text-foreground transition-colors">Store</Link>
              <Link href="/shop?category=mac" className="hover:text-foreground transition-colors">Mac</Link>
              <Link href="/shop?category=ipad" className="hover:text-foreground transition-colors">iPad</Link>
              <Link href="/shop?category=iphone" className="hover:text-foreground transition-colors">iPhone</Link>
              <Link href="/shop?category=accessories" className="hover:text-foreground transition-colors">Accessories</Link>
              <Link href="/shop?category=support" className="hover:text-foreground transition-colors">Support</Link>
            </nav>
          </div>

          {/* Right: Search, Auth, Cart */}
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Search className="size-5 font-light" strokeWidth={1.5} />
            </button>
            
            <AuthButtons user={authUser} />

            {isAdmin && (
              <Link href="/dashboard" className="hidden sm:flex text-sm text-primary hover:text-brand-blue-hover transition-colors font-medium">
                Admin
              </Link>
            )}

            <CartDrawer />

            <button className="md:hidden text-muted-foreground hover:text-foreground transition-colors ml-2">
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full mx-auto">
        {children}
      </main>

      {/* Apple-Style Minimal Footer */}
      <footer className="w-full bg-background border-t border-border mt-auto pt-10 pb-12 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-border">
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Shop and Learn</h3>
              <ul className="space-y-2">
                <li><Link href="/shop" className="hover:underline">Store</Link></li>
                <li><Link href="/shop?category=mac" className="hover:underline">Mac</Link></li>
                <li><Link href="/shop?category=ipad" className="hover:underline">iPad</Link></li>
                <li><Link href="/shop?category=iphone" className="hover:underline">iPhone</Link></li>
                <li><Link href="/shop?category=accessories" className="hover:underline">Accessories</Link></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Services</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="hover:underline">Apple Music</Link></li>
                <li><Link href="/" className="hover:underline">Apple TV+</Link></li>
                <li><Link href="/" className="hover:underline">Cloud Services</Link></li>
              </ul>
              
              <h3 className="font-semibold text-foreground text-sm pt-4">Account</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="hover:underline">Manage Your ID</Link></li>
                <li><Link href="/" className="hover:underline">iCloud.com</Link></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">For Business</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="hover:underline">Apple and Business</Link></li>
                <li><Link href="/" className="hover:underline">Shop for Business</Link></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">About MS Solutions</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="hover:underline">Newsroom</Link></li>
                <li><Link href="/" className="hover:underline">Career Opportunities</Link></li>
                <li><Link href="/" className="hover:underline">Investors</Link></li>
                <li><Link href="/" className="hover:underline">Ethics & Compliance</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6">
            <p className="flex items-center gap-2">Copyright © {new Date().getFullYear()} <img src="/images/logo.png" alt="MS Solutions" className="h-4 w-auto object-contain opacity-70 grayscale" /> Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/" className="hover:text-foreground">Privacy Policy</Link>
              <span className="hidden md:inline">|</span>
              <Link href="/" className="hover:text-foreground">Terms of Use</Link>
              <span className="hidden md:inline">|</span>
              <Link href="/" className="hover:text-foreground">Sales Policy</Link>
              <span className="hidden md:inline">|</span>
              <Link href="/" className="hover:text-foreground">Legal</Link>
              <span className="hidden md:inline">|</span>
              <Link href="/" className="hover:text-foreground">Site Map</Link>
            </div>
          </div>
        </div>
      </footer>
      
      <Toaster richColors position="top-right" />
    </div>
    </GuestCartProvider>
  );
}
