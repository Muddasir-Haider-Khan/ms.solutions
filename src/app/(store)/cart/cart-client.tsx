"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Trash2, Minus, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { updateCartItem, removeFromCart } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

type CartItemData = {
  id: string;
  quantity: number;
  productId: string;
  variantId: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    sellingPrice: number;
    comparePrice: number | null;
    quantityInStock: number;
    status: string;
    images: { url: string; altText: string | null }[];
  };
  productVariant: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number | null;
    comparePrice: number | null;
    quantityInStock: number;
    isActive: boolean;
    image: string | null;
  } | null;
};

export function CartClient({ cartItems }: { cartItems: CartItemData[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleQuantityChange(
    productId: string,
    variantId: string | null,
    newQuantity: number
  ) {
    startTransition(async () => {
      const result = await updateCartItem({
        productId,
        variantId: variantId ?? undefined,
        quantity: newQuantity,
      });
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update quantity");
      }
    });
  }

  function handleRemoveItem(productId: string, variantId: string | null) {
    if (confirm("Are you sure you want to remove this item?")) {
      startTransition(async () => {
        const result = await removeFromCart({
          productId,
          variantId: variantId ?? undefined,
        });
        if (result.success) {
          toast.success("Item removed from cart");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to remove item");
        }
      });
    }
  }

  if (cartItems.length === 0) return null;

  return (
    <div className="flex flex-col">
      {cartItems.map((item, index) => {
        const price =
          item.productVariant?.sellingPrice ?? item.product.sellingPrice;
        const image = item.product.images?.[0];

        return (
          <Card key={item.id} className="overflow-hidden">
            <div className="flex gap-4 p-4">
              <Link
                href={`/shop/${item.product.slug}`}
                className="size-20 shrink-0 overflow-hidden rounded-xl bg-store-light-bg sm:size-24"
              >
                {image ? (
                  <img
                    src={image.url}
                    alt={image.altText || item.product.name}
                    className="size-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Package className="size-8 text-store-muted/30" />
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link href={`/shop/${item.product.slug}`}>
                    <h3 className="text-sm font-medium text-gray-900 hover:text-store-accent sm:text-base">
                      {item.product.name}
                    </h3>
                  </Link>
                  {item.productVariant && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      {item.productVariant.name}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-400">
                    SKU: {item.productVariant?.sku || item.product.sku}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-bold text-store-accent">
                      {formatCurrency(price)}
                    </span>
                    {item.product.comparePrice &&
                      item.product.comparePrice > price && (
                        <span className="text-xs text-store-muted line-through">
                          {formatCurrency(item.product.comparePrice)}
                        </span>
                      )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-gray-300">
                    <button
                      className="flex size-8 items-center justify-center rounded-l-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
                      onClick={() =>
                        handleQuantityChange(
                          item.productId,
                          item.variantId,
                          item.quantity - 1
                        )
                      }
                      disabled={item.quantity <= 1 || isPending}
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      className="flex size-8 items-center justify-center rounded-r-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
                      onClick={() =>
                        handleQuantityChange(
                          item.productId,
                          item.variantId,
                          item.quantity + 1
                        )
                      }
                      disabled={isPending}
                      className="bg-transparent pl-1 pr-6 hover:bg-[#E3E6E6] rounded-r-md outline-none text-[#0F1111] appearance-none cursor-pointer h-full border-none w-[50px] font-bold"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                  
                  <Separator orientation="vertical" className="h-[14px] bg-[#D5D9D9]" />
                  
                  <button 
                    onClick={() => handleRemoveItem(item.productId, item.variantId)}
                    disabled={isPending}
                    className="text-[#007185] hover:text-[#C7511F] hover:underline"
                  >
                    Delete
                  </button>
                  
                  <Separator orientation="vertical" className="h-[14px] bg-[#D5D9D9] hidden sm:block" />

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(lineTotal)}
                    </span>
                    <button
                      className="flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      onClick={() =>
                        handleRemoveItem(item.productId, item.variantId)
                      }
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {index !== cartItems.length - 1 && (
              <Separator className="bg-[#D5D9D9] w-full" />
            )}
          </div>
        );
      })}
    </div>
  );
}
