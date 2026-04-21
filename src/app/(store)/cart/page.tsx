import Link from "next/link";
import { ShoppingBag, Package, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCart } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";
import { CartClient } from "./cart-client";

export const metadata = {
  title: "Cart - Multi Solutions Store",
  description: "Review your shopping cart",
};

export default async function CartPage() {
  const cartResult = await getCart();
  const cart = cartResult.success ? cartResult.data : null;

  const cartItems = cart?.items ?? [];
  const subtotal = cartItems.reduce((sum, item) => {
    const price =
      item.productVariant?.sellingPrice ?? item.product.sellingPrice;
    return sum + price * item.quantity;
  }, 0);

  const isEmpty = cartItems.length === 0;

  return (
    <div className="bg-[#EAEDED] min-h-screen py-4 px-4 md:px-6">
      <div className="max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-6 items-start">
        {isEmpty ? (
          /* Empty Cart State */
          <div className="flex-1 bg-white p-8 flex flex-col-reverse md:flex-row items-center md:items-start gap-8">
            <div className="flex-1">
              <h2 className="text-[24px] font-medium text-[#0F1111] mb-2 leading-tight">
                Your Amazon Cart is empty.
              </h2>
              <p className="text-[14px] text-[#0F1111] mb-6">
                Your Shopping Cart lives to serve. Give it purpose — fill it with electronics, clothing, books, and more.
                <br /><br />
                Continue shopping on the <Link href="/shop" className="text-[#007185] hover:text-[#C7511F] hover:underline">homepage</Link>, learn about today's deals, or visit your Wish List.
              </p>
            </div>
            <div className="w-[300px] shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-[#F8F8F8]">
              <ShoppingBag className="size-32 text-muted-foreground/30 m-8" />
            </div>
          </div>
        ) : (
          <>
            {/* Left Column: Cart Items */}
            <div className="flex-1 bg-white p-4 pt-6 w-full lg:w-auto overflow-hidden">
              <h1 className="text-[28px] font-medium text-[#0F1111] leading-tight">Shopping Cart</h1>
              <span className="text-[#007185] hover:text-[#C7511F] hover:underline text-[14px] cursor-pointer mt-1 inline-block">
                Deselect all items
              </span>
              <div className="text-right text-[14px] text-[#565959] -mt-[20px] mb-2 pr-2">
                Price
              </div>
              <Separator className="bg-[#D5D9D9] mb-4" />
              
              <CartClient cartItems={cartItems} />

              <div className="flex justify-end pt-4 font-normal text-[18px] text-[#0F1111]">
                Subtotal ({cartItems.length} item{cartItems.length !== 1 ? "s" : ""}): <span className="font-bold ml-1">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            {/* Right Column: Order Summary Settings */}
            <div className="w-full lg:w-[300px] shrink-0 bg-white p-5 sticky top-4">
              <div className="flex flex-col gap-4">
                <div className="text-[14px] flex items-start gap-2 text-[#007600] leading-snug">
                  <div className="size-4 shrink-0 rounded-full bg-[#007600] flex items-center justify-center mt-[1px]">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Your order is eligible for FREE Delivery. <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">Choose FREE Delivery</span> at checkout.</span>
                </div>

                <div className="flex text-[18px] text-[#0F1111] items-baseline flex-wrap">
                  <span>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? "s" : ""}):</span>
                  <span className="font-bold ml-1">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" id="gift" className="accent-[#007185] size-4" />
                  <label htmlFor="gift" className="text-[14px] text-[#0F1111]">This order contains a gift</label>
                </div>

                <Link href="/checkout" className="w-full">
                  <Button className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] rounded-full h-[32px] text-[13px] shadow-[0_2px_5px_rgba(213,217,217,0.5)] font-normal border border-[#FCD200]/50">
                    Proceed to checkout
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
