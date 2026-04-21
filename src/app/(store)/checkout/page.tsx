import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCart } from "@/actions/store";
import { formatCurrency } from "@/lib/slugs";
import { CheckoutClient } from "./checkout-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Checkout - Multi Solutions Store",
  description: "Complete your order",
};

export default async function CheckoutPage() {
  const cartResult = await getCart();
  const cart = cartResult.success ? cartResult.data : null;

  const cartItems = cart?.items ?? [];

  // Removed server-side redirect to allow guest carts to be resolved perfectly on the client
  // if (cartItems.length === 0) {
  //   redirect("/cart");
  // }

  const subtotal = cartItems.reduce((sum, item) => {
    const price =
      item.productVariant?.sellingPrice ?? item.product.sellingPrice;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="bg-white min-h-screen py-6 px-4 md:px-6">
      <div className="max-w-[1100px] mx-auto -mt-6">
        <h1 className="text-[28px] font-normal text-[#0F1111] py-4">
          Checkout <span className="text-[18px] text-[#565959]">({cartItems.length} items)</span>
        </h1>
        
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutClient />
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full bg-white border border-[#D5D9D9] rounded-lg p-5">
            <h3 className="font-bold text-[18px] text-[#0F1111] mb-4">Order Summary</h3>
            
            <div className="space-y-4 text-[14px] text-[#0F1111]">
              <div className="flex justify-between">
                <span>Items:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Postage & Packing:</span>
                <span>Calculated at next step</span>
              </div>
              <div className="flex justify-between">
                <span>Total before tax:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span>Tax:</span>
                <span>Rs. 0</span>
              </div>
              
              <div className="flex justify-between font-bold text-[20px] text-[#B12704] pt-2">
                <span className="text-[#0F1111] text-[18px]">Order Total:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#D5D9D9]">
              <div className="bg-[#F0F2F2] p-3 text-[12px] text-[#0F1111] rounded-md border border-[#D5D9D9]">
                <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">How are delivery costs calculated?</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
