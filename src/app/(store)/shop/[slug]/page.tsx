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
  MapPin,
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

      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Left Column: Product Images (approx 40%) */}
        <div className="w-full lg:w-[40%] flex gap-4">
          {/* Thumbnails (vertical on desktop) */}
          {product.images && product.images.length > 1 && (
            <div className="hidden md:flex flex-col gap-2 w-12 shrink-0">
              {product.images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square cursor-pointer overflow-hidden rounded-sm border border-transparent hover:border-[#FF9900] shadow-[0_0_2px_rgba(0,0,0,0.15)]"
                >
                  <img
                    src={image.url}
                    alt={image.altText || `${product.name} ${index + 1}`}
                    className="size-full object-contain mix-blend-multiply"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="relative flex-1 aspect-square bg-[#F8F8F8] p-4 flex items-center justify-center">
            {mainImage ? (
              <img
                src={mainImage.url}
                alt={mainImage.altText || product.name}
                className="max-h-full max-w-full object-contain mix-blend-multiply"
              />
            ) : (
              <Package className="size-24 text-muted-foreground/30" />
            )}
            {product.comparePrice &&
              product.comparePrice > product.sellingPrice && (
                <div className="absolute right-0 top-0 bg-[#CC0C39] text-white text-[12px] px-2 py-1 font-bold rounded-bl-md">
                  {Math.round(
                    ((product.comparePrice - product.sellingPrice) /
                      product.comparePrice) *
                      100
                  )}
                  % off
                </div>
              )}
          </div>
        </div>

        {/* Center Column: Product Info (approx 35%) */}
        <div className="w-full lg:w-[35%] flex flex-col pt-1">
          <h1 className="text-[24px] font-medium leading-[1.3] text-[#0F1111]">
            {product.name}
          </h1>
          {product.brand && (
            <Link href={`/shop?brand=${product.brand}`} className="text-[14px] text-[#007185] hover:text-[#C7511F] hover:underline mt-1">
              Visit the {product.brand} Store
            </Link>
          )}
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <span className="text-[14px] text-[#FFA41C]">★★★★☆</span>
              <span className="text-[#007185] text-[14px] hover:underline cursor-pointer">
                128 ratings
              </span>
            </div>
            <span className="text-[14px] text-[#007185] hover:underline cursor-pointer">Search this page</span>
          </div>

          <Separator className="my-3 bg-[#D5D9D9]" />

          {/* Price Block */}
          <div className="flex flex-col gap-1">
            {product.comparePrice && product.comparePrice > product.sellingPrice && (
              <div className="flex items-center gap-2">
                <span className="text-[24px] text-[#CC0C39] whitespace-nowrap leading-none mt-1">
                 -{Math.round(((product.comparePrice - product.sellingPrice) / product.comparePrice) * 100)}%
                </span>
                <div className="flex items-baseline gap-[2px]">
                  <span className="text-[13px] text-[#0F1111] relative -top-[8px]">Rs.</span>
                  <span className="text-[28px] font-medium text-[#0F1111] leading-none">
                    {product.sellingPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            {!product.comparePrice || product.comparePrice <= product.sellingPrice ? (
              <div className="flex items-baseline gap-[2px]">
                <span className="text-[13px] text-[#0F1111] relative -top-[8px]">Rs.</span>
                <span className="text-[28px] font-medium text-[#0F1111] leading-none">
                  {product.sellingPrice.toLocaleString()}
                </span>
              </div>
            ) : null}

            {product.comparePrice && product.comparePrice > product.sellingPrice && (
              <div className="text-[12px] text-[#565959] mt-[2px] flex items-center gap-1">
                Typical price: <span className="line-through">Rs. {product.comparePrice.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Tax info */}
          <div className="text-[14px] text-[#0F1111] mt-2">
            Inclusive of all taxes.
          </div>
          
          <Separator className="my-4 bg-[#D5D9D9]" />

          {/* Extra generic specs */}
          <div className="grid grid-cols-[120px_1fr] gap-2 text-[14px] text-[#0F1111] mb-2">
            <span className="font-bold">SKU</span>
            <span className="font-mono text-xs">{product.sku}</span>
          </div>

          <Separator className="my-4 bg-[#D5D9D9]" />

          {/* Description */}
          <div className="text-[14px] text-[#0F1111] space-y-4">
            <h3 className="font-bold text-[16px]">About this item</h3>
            {product.shortDescription && (
              <ul className="list-disc pl-5 space-y-2">
                <li>{product.shortDescription}</li>
              </ul>
            )}
            {product.description && (
              <div className="whitespace-pre-line leading-relaxed">
                {product.description}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Buy Box (approx 25%) */}
        <div className="w-full lg:w-72 lg:min-w-[280px]">
          <div className="border border-[#D5D9D9] rounded-lg p-4 bg-white">
            <div className="flex items-baseline gap-[2px] mb-2">
               <span className="text-[12px] text-[#0F1111] relative -top-[4px]">Rs.</span>
               <span className="text-[24px] font-medium text-[#0F1111] leading-none">
                 {product.sellingPrice.toLocaleString()}
               </span>
            </div>

            <div className="text-[14px] text-[#0F1111] leading-snug mb-4">
              <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">FREE Returns</span>
            </div>

            <div className="flex gap-2 items-start mt-2">
               <MapPin className="size-[16px] text-[#0F1111] shrink-0 mt-[2px]" />
               <span className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer leading-tight">
                 Deliver to Pakistan
               </span>
            </div>
            
            <h2 className="text-[18px] font-medium text-[#007600] mt-4 mb-2">
              {product.quantityInStock > 0 ? "In Stock" : <span className="text-[#B12704]">Currently unavailable.</span>}
            </h2>

            <ProductDetailClient product={product} isAuthenticated={!!session?.user} />

            <div className="mt-4 space-y-2 text-[12px] text-[#565959]">
              <div className="grid grid-cols-[100px_1fr]">
                <span>Payment</span>
                <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">Secure transaction</span>
              </div>
              <div className="grid grid-cols-[100px_1fr]">
                <span>Ships from</span>
                <span>Multi Solutions</span>
              </div>
              <div className="grid grid-cols-[100px_1fr]">
                <span>Sold by</span>
                <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">Multi Solutions</span>
              </div>
              <div className="grid grid-cols-[100px_1fr]">
                <span>Returns</span>
                <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">Eligible for Return</span>
              </div>
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
