import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  Shield,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getStoreProduct, getRelatedProducts } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";
import { ProductDetailClient } from "./product-detail-client";
import { ProductImageGallery } from "./product-image-gallery";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Package } from "lucide-react";

export const metadata = {
  title: "Product - MS Solutions",
  description: "View product details",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [productResult, session] = await Promise.all([
    getStoreProduct(slug),
    getServerSession(authOptions),
  ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  const product = productResult.data;

  const relatedWithCategory = await getRelatedProducts(
    product.id,
    product.categoryId ?? undefined
  );
  const relatedProducts =
    relatedWithCategory.success && relatedWithCategory.data
      ? relatedWithCategory.data
      : [];

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
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-[#fafafa]">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="transition-colors hover:text-store-accent">Home</Link>
            <ChevronRight className="size-3.5 text-gray-400" />
            <Link href="/shop" className="transition-colors hover:text-store-accent">Shop</Link>
            {product.category && (
              <>
                <ChevronRight className="size-3.5 text-gray-400" />
                <Link href={`/shop?category=${product.category.id}`} className="transition-colors hover:text-store-accent">
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="size-3.5 text-gray-400" />
            <span className="font-medium text-store-accent line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Product Images — interactive gallery */}
          <div className="relative">
            {hasDiscount && (
              <div className="absolute left-4 top-4 z-10 rounded-lg bg-store-sale px-3 py-1 text-sm font-bold text-white shadow">
                -{discountPercent}% OFF
              </div>
            )}
            <ProductImageGallery
              images={(product.images ?? []).map((img) => ({
                id: img.id,
                url: img.url,
                altText: img.altText ?? null,
              }))}
              productName={product.name}
            />
          </div>

          {/* Product Info — sticky on desktop */}
          <div className="flex flex-col lg:sticky lg:top-24 lg:self-start">
            {/* Category + Brand */}
            <div className="flex items-center gap-3">
              {product.category && (
                <Link
                  href={`/shop?category=${product.category.id}`}
                  className="rounded-full bg-store-accent-light px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-store-accent"
                >
                  {product.category.name}
                </Link>
              )}
              {product.brand && (
                <span className="text-[12px] text-gray-400">{product.brand}</span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
              {product.name}
            </h1>

            <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
              <span className="font-mono">SKU: {product.sku}</span>
            </div>

            {/* Price block */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-store-accent">
                {formatCurrency(product.sellingPrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-store-muted line-through">
                    {formatCurrency(product.comparePrice!)}
                  </span>
                  <span className="rounded-md bg-store-sale/10 px-2 py-0.5 text-xs font-bold text-store-sale">
                    Save {formatCurrency(product.comparePrice! - product.sellingPrice)}
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="mt-3">
              {product.quantityInStock > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
                  In Stock ({product.quantityInStock} available)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  <span className="size-1.5 rounded-full bg-red-500" />
                  Out of Stock
                </span>
              )}
            </div>

            <Separator className="my-5" />

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-sm leading-relaxed text-gray-600">
                {product.shortDescription}
              </p>
            )}

            {/* Add to Cart */}
            <div className="mt-5">
              <ProductDetailClient
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  sku: product.sku,
                  sellingPrice: product.sellingPrice,
                  comparePrice: product.comparePrice ?? null,
                  quantityInStock: product.quantityInStock,
                  trackInventory: product.trackInventory,
                  images: product.images ?? [],
                  variants: product.variants ?? [],
                }}
                isAuthenticated={!!session?.user}
              />
            </div>

            {/* Trust badges */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { icon: Truck,      label: "Fast Delivery",    sub: "Nationwide" },
                { icon: Shield,     label: "Secure Payment",   sub: "100% Safe" },
                { icon: RotateCcw,  label: "Easy Returns",     sub: "7-day policy" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 p-3 text-center transition-all hover:border-store-accent/30 hover:bg-store-accent-light/30">
                  <Icon className="size-5 text-store-accent" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-700">{label}</p>
                    <p className="text-[10px] text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full description */}
        {product.description && (
          <section className="mt-12 border-t border-gray-100 pt-10">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Product Description</h2>
            <div className="prose prose-sm max-w-none whitespace-pre-line text-[14px] leading-relaxed text-gray-600">
              {product.description}
            </div>
          </section>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 border-t border-gray-100 pt-10">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Related Products</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {relatedProducts.map((related) => {
                const relHasDiscount =
                  related.comparePrice && related.comparePrice > related.sellingPrice;
                const relDiscountPercent = relHasDiscount
                  ? Math.round(
                      ((related.comparePrice! - related.sellingPrice) / related.comparePrice!) * 100
                    )
                  : 0;

                return (
                  <Link key={related.id} href={`/shop/${related.slug}`}>
                    <div className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-200 hover:shadow-lg hover:shadow-black/8">
                      <div className="relative aspect-square overflow-hidden bg-store-light-bg">
                        {related.images && related.images.length > 0 ? (
                          <img
                            src={related.images[0].url}
                            alt={related.name}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Package className="size-10 text-store-muted/30" />
                          </div>
                        )}
                        {relHasDiscount && (
                          <span className="absolute right-2.5 top-2.5 rounded-md bg-store-sale px-2 py-0.5 text-[11px] font-bold text-white">
                            -{relDiscountPercent}%
                          </span>
                        )}
                      </div>
                      <div className="p-3.5">
                        <h3 className="line-clamp-2 text-sm font-medium text-gray-900">{related.name}</h3>
                        <span className="mt-1 block text-base font-bold text-store-accent">
                          {formatCurrency(related.sellingPrice)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
