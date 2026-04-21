import Link from "next/link";
import { ArrowRight, Package, ShieldCheck, Zap, Headphones, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoreProducts, getStoreCategories } from "@/actions/store";

export const metadata = {
  title: "MS Solutions - Store",
  description: "Shop premium digital products at competitive prices.",
};

export default async function StoreHomePage() {
  const [featuredResult, categoriesResult] = await Promise.all([
    getStoreProducts({ featured: true, limit: 8 }),
    getStoreCategories(),
  ]);

  const featuredProducts =
    featuredResult.success && featuredResult.data ? featuredResult.data.products : [];
  const categories =
    categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];

  return (
    <div className="flex flex-col bg-background selection:bg-primary/20">
      
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden w-full min-h-[85vh] flex items-center justify-center">
        {/* Subtle glowing ambient layer */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] opacity-70 pointer-events-none" />
        
        <div className="container relative z-10 mx-auto px-4 text-center mt-[-10vh]">
          <h2 className="text-primary font-semibold tracking-wide uppercase text-xs sm:text-sm mb-6">
            Welcome to the future of retail
          </h2>
          <h1 className="text-5xl sm:text-7xl md:text-[90px] font-bold tracking-tighter leading-[1.05] text-foreground max-w-5xl mx-auto">
            Pro power.<br />
            <span className="text-muted-foreground">Everyday incredible.</span>
          </h1>
          <p className="mt-8 text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-snug">
            Discover our wide range of curated technology and essentials designed to elevate your everyday experience.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-base font-medium"
              render={<Link href="/shop" />}
              nativeButton={false}
            >
              Shop Now
            </Button>
            <Button
              size="lg"
              variant="link"
              className="text-base font-medium text-primary hover:text-brand-blue-hover"
              render={<Link href="/shop" />}
              nativeButton={false}
            >
              Explore categories <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products Showcase */}
      {featuredProducts.length > 0 && (
        <section className="w-full py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
            <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                  The latest.
                  <span className="text-muted-foreground block md:inline md:ml-3">Take a look at what's new.</span>
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link
                  href={`/shop/${product.slug}`}
                  key={product.id}
                  className="group relative flex flex-col overflow-hidden bg-card rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out h-[480px]"
                >
                  <div className="flex flex-col flex-1 z-10 relative">
                    {/* Status badge if any */}
                    {product.comparePrice && product.comparePrice > product.sellingPrice && (
                      <span className="text-[11px] font-semibold text-[#ff3b30] uppercase tracking-wider mb-2">
                        Special Offer
                      </span>
                    )}

                    <h3 className="text-xl font-semibold leading-tight text-foreground mt-1 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="mt-3 flex items-baseline gap-[2px]">
                      <span className="text-sm text-foreground">Rs.</span>
                      <span className="text-xl font-medium text-foreground">
                        {product.sellingPrice.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="mt-auto pt-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                      <span className="text-sm font-medium text-primary">View details</span>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <ArrowRight className="size-4" />
                      </div>
                    </div>
                  </div>

                  {/* Image container absolute to float at the bottom */}
                  <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[85%] h-[60%] flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-105 group-hover:-translate-y-4">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].altText || product.name}
                        className="max-h-full object-contain mix-blend-multiply drop-shadow-2xl"
                      />
                    ) : (
                      <Package className="size-24 text-muted-foreground/20" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Banners */}
      {categories.length > 0 && (
        <section className="w-full py-24 bg-[#fbfbfd]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
             <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-16 text-center">
                Explore line-up.
             </h2>
             
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories
                .filter((cat) => cat._count.products > 0)
                .slice(0, 3) // Only show top 3 as large banners
                .map((category) => (
                  <Link
                    key={category.id}
                    href={`/shop?category=${category.id}`}
                    className="group relative overflow-hidden bg-card rounded-[2rem] aspect-[4/5] flex flex-col items-center justify-start p-10 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                  >
                    <h3 className="text-2xl font-semibold text-foreground text-center z-10">
                      {category.name}
                    </h3>
                    <div className="mt-auto absolute bottom-0 w-full h-[65%] flex justify-center items-end pb-8 transition-transform duration-700 group-hover:scale-110 ease-out">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="max-h-[90%] max-w-[90%] object-contain mix-blend-multiply drop-shadow-xl"
                        />
                      ) : (
                        <Package className="size-32 text-muted-foreground/20 mb-10" />
                      )}
                    </div>
                  </Link>
                ))}
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

      {/* Trust & Services */}
      <section className="w-full py-24 bg-background border-t border-border/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center size-16 rounded-full bg-secondary">
                <Zap className="size-6 text-foreground" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-1">Fast Delivery</h4>
                <p className="text-sm text-muted-foreground">Get your products delivered quickly nationwide.</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center size-16 rounded-full bg-secondary">
                <ShieldCheck className="size-6 text-foreground" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-1">Secure Checkout</h4>
                <p className="text-sm text-muted-foreground">Enterprise-level security for your peace of mind.</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center size-16 rounded-full bg-secondary">
                <Headphones className="size-6 text-foreground" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-1">Expert Support</h4>
                <p className="text-sm text-muted-foreground">Our specialists are here to help you anytime.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="w-full py-24 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center max-w-3xl flex flex-col items-center">
          <Package className="size-12 mb-6 opacity-80" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Ready to dive in?
          </h2>
          <p className="text-lg text-background/70 mb-10">
            Experience the finest digital retail ecosystem. Curated exactly for your needs.
          </p>
          <Button
            className="rounded-full bg-background text-foreground hover:bg-background/90 px-8 py-6 text-base font-semibold"
            render={<Link href="/shop" />}
            nativeButton={false}
          >
            Start exploring
          </Button>
        </div>
      </section>
    </div>
  );
}
