"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { updateCartItem, removeFromCart } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";
import { toast } from "sonner";

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

  return (
    <div className="space-y-3">
      {cartItems.map((item) => {
        const price =
          item.productVariant?.sellingPrice ?? item.product.sellingPrice;
        const lineTotal = price * item.quantity;
        const image = item.product.images?.[0];

        return (
          <Card key={item.id} className="overflow-hidden">
            <div className="flex gap-4 p-4">
              {/* Product Image */}
              <Link
                href={`/shop/${item.product.slug}`}
                className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24"
              >
                {image ? (
                  <img
                    src={image.url}
                    alt={image.altText || item.product.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Package className="size-8 text-muted-foreground/30" />
                  </div>
                )}
              </Link>

              {/* Product Info */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link href={`/shop/${item.product.slug}`}>
                    <h3 className="text-sm font-medium hover:text-primary sm:text-base">
                      {item.product.name}
                    </h3>
                  </Link>
                  {item.productVariant && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.productVariant.name}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    SKU: {item.productVariant?.sku || item.product.sku}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">
                      {formatCurrency(price)}
                    </span>
                    {item.product.comparePrice &&
                      item.product.comparePrice > price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(item.product.comparePrice)}
                        </span>
                      )}
                  </div>
                </div>

                {/* Quantity and Actions */}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border">
                    <Button
                      variant="ghost"
                      size="icon-xs"
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
                    </Button>
                    <span className="min-w-[2rem] text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        handleQuantityChange(
                          item.productId,
                          item.variantId,
                          item.quantity + 1
                        )
                      }
                      disabled={isPending}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">
                      {formatCurrency(lineTotal)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        handleRemoveItem(item.productId, item.variantId)
                      }
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
