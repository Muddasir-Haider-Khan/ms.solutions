import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Truck,
  Shield,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
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
    getRelatedProducts("", undefined),
    getServerSession(authOptions),
  ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  const product = productResult.data;

  let relatedProducts: {
    id: string;
    name: string;
    slug: string;
    sellingPrice: number;
    comparePrice: number | null;
    images: { url: string }[];
  }[] = [];
  if (relatedResult.success && relatedResult.data) {
    relatedProducts = relatedResult.data;
  }

  const relatedWithCategory = await getRelatedProducts(
    product.id,
    product.categoryId ?? undefined
  );
  if (relatedWithCategory.success && relatedWithCategory.data) {
    relatedProducts = relatedWithCategory.data;
  }

  const mainImage =
    product.images && product.images.length > 0 ? product.images[0] : null;

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
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/" className="transition-colors hover:text-store-accent">
          Home
        </Link>
        <ChevronRight className="size-3.5 text-gray-400" />
        <Link href="/shop" className="transition-colors hover:text-store-accent">
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRight className="size-3.5 text-gray-400" />
            <Link
              href={`/shop?category=${product.category.id}`}
              className="transition-colors hover:text-store-accent"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5 text-gray-400" />
        <span className="font-medium text-store-accent">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-store-light-bg">
            {mainImage ? (
              <img
                src={mainImage.url}
                alt={mainImage.altText || product.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Package className="size-24 text-store-muted/30" />
              </div>
            )}
            {hasDiscount && (
              <span className="absolute right-4 top-4 rounded-lg bg-store-sale px-3 py-1 text-sm font-bold text-white">
                -{discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {product.images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-store-light-bg ring-2 ring-transparent transition-all hover:ring-store-accent"
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
            <Link
              href={`/shop?category=${product.category.id}`}
              className="text-xs font-semibold uppercase tracking-wider text-store-accent"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
            {product.name}
          </h1>

          {product.brand && (
            <p className="mt-1 text-sm text-gray-500">
              Brand:{" "}
              <span className="font-medium text-gray-700">{product.brand}</span>
            </p>
          )}

          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs text-gray-400">SKU:</span>
            <span className="font-mono text-xs text-gray-400">
              {product.sku}
            </span>
          </div>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-store-accent">
              {formatCurrency(product.sellingPrice)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-store-muted line-through">
                  {formatCurrency(product.comparePrice!)}
                </span>
                <span className="rounded-md bg-store-sale/10 px-2 py-0.5 text-xs font-bold text-store-sale">
                  Save {discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div className="mt-3">
            {product.quantityInStock > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                <span className="size-1.5 rounded-full bg-green-500" />
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

          {/* Description */}
          {product.shortDescription && (
            <p className="text-sm leading-relaxed text-gray-600">
              {product.shortDescription}
            </p>
          )}

          {product.description && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Description
              </h3>
              <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-500">
                {product.description}
              </div>
            </div>
          )}

          <Separator className="my-5" />

          {/* Add to Cart section */}
          <ProductDetailClient
            product={product}
            isAuthenticated={!!session?.user}
          />

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors hover:border-store-accent/30">
              <Truck className="size-5 text-store-accent" />
              <span className="text-[10px] font-semibold text-gray-700">
                Fast Delivery
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors hover:border-store-accent/30">
              <Shield className="size-5 text-store-accent" />
              <span className="text-[10px] font-semibold text-gray-700">
                Secure Payment
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors hover:border-store-accent/30">
              <RotateCcw className="size-5 text-store-accent" />
              <span className="text-[10px] font-semibold text-gray-700">
                Easy Returns
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Related Products
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {relatedProducts.map((related) => {
              const relHasDiscount =
                related.comparePrice &&
                related.comparePrice > related.sellingPrice;
              const relDiscountPercent = relHasDiscount
                ? Math.round(
                    ((related.comparePrice! - related.sellingPrice) /
                      related.comparePrice!) *
                      100
                  )
                : 0;

              return (
                <Link key={related.id} href={`/shop/${related.slug}`}>
                  <div className="group overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:shadow-lg hover:shadow-black/8">
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
                      <h3 className="line-clamp-1 text-sm font-medium text-gray-900">
                        {related.name}
                      </h3>
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
  );
}
