"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Package } from "lucide-react";
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
          <div key={item.id}>
            <div className="flex gap-4 py-4 w-full">
              {/* Checkbox */}
              <div className="pt-2 hidden sm:block">
                <input type="checkbox" className="accent-[#007185] size-4" defaultChecked />
              </div>

              {/* Product Image */}
              <Link
                href={`/shop/${item.product.slug}`}
                className="w-24 sm:w-32 shrink-0 aspect-square overflow-hidden bg-white p-2"
              >
                {image ? (
                  <img
                    src={image.url}
                    alt={image.altText || item.product.name}
                    className="size-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-[#F8F8F8]">
                    <Package className="size-10 text-muted-foreground/30" />
                  </div>
                )}
              </Link>

              {/* Product Info & Actions */}
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <Link href={`/shop/${item.product.slug}`}>
                      <h3 className="text-[18px] font-medium text-[#0F1111] hover:text-[#C7511F] leading-tight line-clamp-3">
                        {item.product.name}
                      </h3>
                    </Link>
                    <div className="text-[12px] text-[#007600] font-medium mt-1 mb-1">
                      {item.product.quantityInStock > 0 ? "In Stock" : <span className="text-[#B12704]">Out of Stock</span>}
                    </div>
                    <div className="text-[14px] text-[#565959] flex items-center gap-1 mb-1">
                      <input type="checkbox" className="accent-[#007185] size-[13px]" />
                      <span>This is a gift <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">Learn more</span></span>
                    </div>

                    {item.productVariant && (
                      <p className="mt-0.5 text-[14px] text-[#0F1111] font-bold">
                        Style: <span className="font-normal">{item.productVariant.name}</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Price on right */}
                  <div className="text-right flex-shrink-0 font-bold text-[18px] text-[#0F1111]">
                     {formatCurrency(price)}
                  </div>
                </div>

                {/* Actions Row */}
                <div className="mt-auto pt-4 flex flex-wrap items-center gap-3 md:gap-4 text-[14px]">
                  {/* QTY selector */}
                  <div className="bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-md shadow-[0_2px_5px_rgba(213,217,217,0.5)] flex items-center h-[30px] pr-2">
                    <span className="pl-2 pr-1 text-[#0F1111] pointer-events-none select-none">Qty:</span>
                    <select
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.productId, item.variantId, Number(e.target.value))}
                      disabled={isPending}
                      className="bg-transparent pl-1 pr-6 hover:bg-[#E3E6E6] rounded-r-md outline-none text-[#0F1111] appearance-none cursor-pointer h-full border-none w-[50px] font-bold"
                    >
                      {[...Array(Math.min(10, item.product.quantityInStock || 10))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="size-3 absolute right-3 pointer-events-none" />
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

                  <button className="text-[#007185] hover:text-[#C7511F] hover:underline hidden sm:block">
                    Save for later
                  </button>

                  <Separator orientation="vertical" className="h-[14px] bg-[#D5D9D9] hidden md:block" />

                  <button className="text-[#007185] hover:text-[#C7511F] hover:underline hidden md:block">
                    Compare with similar items
                  </button>
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
