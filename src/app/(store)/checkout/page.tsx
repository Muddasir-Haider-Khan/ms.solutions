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
        
        <CheckoutClient />
      </div>
    </div>
  );
}
