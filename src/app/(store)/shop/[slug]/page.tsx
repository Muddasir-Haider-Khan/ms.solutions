import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Minus,
  Plus,
  ArrowLeft,
  Share2,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getStoreProduct, getRelatedProducts } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";
import { ProductDetailClient } from "./product-detail-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "Product - Multi Solutions Store",
  description: "View product details",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [productResult, relatedResult, session] = await Promise.all([
    getStoreProduct(slug),
    getRelatedProducts("", undefined), // We'll get related after knowing the product
    getServerSession(authOptions),
  ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  const product = productResult.data;

  // Get related products now that we know the category
  let relatedProducts: { id: string; name: string; slug: string; sellingPrice: number; comparePrice: number | null; images: { url: string }[] }[] = [];
  if (relatedResult.success && relatedResult.data) {
    relatedProducts = relatedResult.data;
  }

  // Re-fetch related with the correct category
  const relatedWithCategory = await getRelatedProducts(
    product.id,
    product.categoryId ?? undefined
  );
  if (relatedWithCategory.success && relatedWithCategory.data) {
    relatedProducts = relatedWithCategory.data;
  }

  const mainImage =
    product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-foreground transition-colors">
          Shop
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/shop?category=${product.category.id}`}
              className="hover:text-foreground transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {mainImage ? (
              <img
                src={mainImage.url}
                alt={mainImage.altText || product.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Package className="size-24 text-muted-foreground/30" />
              </div>
            )}
            {product.comparePrice &&
              product.comparePrice > product.sellingPrice && (
                <Badge
                  variant="destructive"
                  className="absolute right-3 top-3"
                >
                  -
                  {Math.round(
                    ((product.comparePrice - product.sellingPrice) /
                      product.comparePrice) *
                      100
                  )}
                  % OFF
                </Badge>
              )}
          </div>

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10"
                >
                  <img
                    src={image.url}
                    alt={image.altText || `${product.name} ${index + 1}`}
                    className="size-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          {product.category && (
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {product.category.name}
            </p>
          )}

          <h1 className="mt-1 text-2xl font-bold md:text-3xl">
            {product.name}
          </h1>

          {product.brand && (
            <p className="mt-1 text-sm text-muted-foreground">
              Brand: <span className="font-medium">{product.brand}</span>
            </p>
          )}

          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs text-muted-foreground">SKU:</span>
            <span className="text-xs font-mono text-muted-foreground">
              {product.sku}
            </span>
          </div>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(product.sellingPrice)}
            </span>
            {product.comparePrice &&
              product.comparePrice > product.sellingPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(product.comparePrice)}
                </span>
              )}
          </div>

          {/* Stock Status */}
          <div className="mt-3">
            {product.quantityInStock > 0 ? (
              <Badge variant="secondary" className="gap-1">
                <span className="size-1.5 rounded-full bg-green-500" />
                In Stock ({product.quantityInStock} available)
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <span className="size-1.5 rounded-full bg-destructive" />
                Out of Stock
              </Badge>
            )}
          </div>

          <Separator className="my-4" />

          {/* Description */}
          {product.shortDescription && (
            <p className="text-sm text-muted-foreground">
              {product.shortDescription}
            </p>
          )}

          {product.description && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Description</h3>
              <div className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {product.description}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Add to Cart section - Client Component */}
          <ProductDetailClient product={product} isAuthenticated={!!session?.user} />

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
              <Truck className="size-5 text-primary" />
              <span className="text-[10px] font-medium">Fast Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
              <Shield className="size-5 text-primary" />
              <span className="text-[10px] font-medium">Secure Payment</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
              <RotateCcw className="size-5 text-primary" />
              <span className="text-[10px] font-medium">Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {relatedProducts.map((related) => (
              <Link key={related.id} href={`/shop/${related.slug}`}>
                <Card className="group h-full overflow-hidden transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20">
                  <div className="aspect-square overflow-hidden bg-muted">
                    {related.images && related.images.length > 0 ? (
                      <img
                        src={related.images[0].url}
                        alt={related.name}
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Package className="size-10 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="line-clamp-1 text-sm font-medium">
                      {related.name}
                    </h3>
                    <span className="mt-1 block text-sm font-bold text-primary">
                      {formatCurrency(related.sellingPrice)}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
