import Link from "next/link";
import { ArrowRight, Package, Star, Truck, Shield, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStoreProducts, getStoreCategories } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";

export const metadata = {
  title: "Multi Solutions Store - Your One-Stop Shop",
  description:
    "Shop quality products at competitive prices. Fast delivery nationwide.",
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
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              Welcome to Multi Solutions Store
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Quality Products,{" "}
              <span className="text-primary">Best Prices</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Discover our wide range of products. From everyday essentials to
              specialty items, we have everything you need at prices that fit
              your budget.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" render={<Link href="/shop" />}>
                Shop Now
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/shop" />}>
                Browse Categories
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-primary/5 blur-3xl" />
      </section>

      {/* Trust badges */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <Truck className="size-6 text-primary" />
            <div>
              <p className="text-sm font-medium">Free Shipping</p>
              <p className="text-xs text-muted-foreground">On orders above threshold</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <Shield className="size-6 text-primary" />
            <div>
              <p className="text-sm font-medium">Secure Payments</p>
              <p className="text-xs text-muted-foreground">100% safe checkout</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <Star className="size-6 text-primary" />
            <div>
              <p className="text-sm font-medium">Quality Products</p>
              <p className="text-xs text-muted-foreground">Verified and tested</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <Headphones className="size-6 text-primary" />
            <div>
              <p className="text-sm font-medium">Customer Support</p>
              <p className="text-xs text-muted-foreground">Dedicated help team</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Featured Products</h2>
              <p className="text-sm text-muted-foreground">
                Handpicked products just for you
              </p>
            </div>
            <Link
              href="/shop"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View All
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <Link key={product.id} href={`/shop/${product.slug}`}>
                <Card className="group h-full overflow-hidden transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20">
                  <div className="aspect-square overflow-hidden bg-muted">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].altText || product.name}
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Package className="size-12 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    {product.brand && (
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {product.brand}
                      </p>
                    )}
                    <h3 className="mt-0.5 line-clamp-2 text-sm font-medium leading-tight">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                      {product.comparePrice && product.comparePrice > product.sellingPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(product.comparePrice)}
                        </span>
                      )}
                    </div>
                    {product.quantityInStock <= 0 && (
                      <Badge variant="destructive" className="mt-2 text-[10px]">
                        Out of Stock
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories Grid */}
      {categories.length > 0 && (
        <section className="bg-muted/30">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold">Shop by Category</h2>
              <p className="text-sm text-muted-foreground">
                Browse our product categories
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {categories
                .filter((cat) => cat._count.products > 0)
                .map((category) => (
                  <Link
                    key={category.id}
                    href={`/shop?category=${category.id}`}
                  >
                    <Card className="group h-full overflow-hidden transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20">
                      <div className="aspect-[4/3] overflow-hidden bg-muted">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="size-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full flex-col items-center justify-center gap-2">
                            <Package className="size-8 text-muted-foreground/40" />
                            <span className="text-xs text-muted-foreground">
                              {category._count.products} products
                            </span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="text-sm font-semibold">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {category._count.products} product{category._count.products !== 1 ? "s" : ""}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 text-center text-primary-foreground md:p-12">
          <h2 className="text-2xl font-bold md:text-3xl">
            Ready to Start Shopping?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-primary-foreground/80">
            Browse our complete catalog and find exactly what you need. Fast
            delivery and great prices guaranteed.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-6"
            render={<Link href="/shop" />}
          >
            Browse All Products
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
