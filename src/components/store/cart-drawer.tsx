"use client";

import { useGuestCart } from "@/lib/guest-cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ShoppingBag, X, Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/slugs";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const { items, totalQuantity, subtotal, updateQuantity, removeItem } = useGuestCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative text-muted-foreground hover:text-foreground transition-colors group">
          <ShoppingBag className="size-5 font-light" strokeWidth={1.5} />
          {totalQuantity > 0 && (
            <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground group-hover:scale-110 transition-transform">
              {totalQuantity}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-white/80 backdrop-blur-3xl border-l border-white/20 p-0 flex flex-col">
        <div className="p-6 border-b border-gray-100/50">
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle className="text-2xl font-semibold tracking-tight">Bag</SheetTitle>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <ShoppingBag className="size-16 text-muted-foreground/20" strokeWidth={1} />
              <p className="text-lg font-medium text-muted-foreground">Your bag is empty.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 p-4 rounded-3xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-transparent hover:border-gray-100 transition-all">
                  <div className="w-20 h-20 bg-[#F5F5F7] rounded-2xl flex items-center justify-center p-2 isolate overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                      <ShoppingBag className="size-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <Link href={`/shop/${item.slug}`} className="font-semibold text-[15px] leading-tight line-clamp-2 hover:underline">
                        {item.name}
                      </Link>
                      <button onClick={() => removeItem(item.productId, item.variantId)} className="text-muted-foreground hover:text-red-500 transition-colors ml-2">
                        <X className="size-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center bg-[#F5F5F7] rounded-full p-1 overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.variantId, Math.min(item.quantityInStock, item.quantity + 1))}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <span className="font-semibold">{formatCurrency(item.sellingPrice * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-3xl">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[15px] text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[15px] text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-xl font-semibold border-t border-gray-100 pt-3">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
            
            <SheetClose asChild>
              <Link href="/checkout">
                <Button className="w-full rounded-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_8px_24px_rgba(24,127,244,0.25)] flex items-center justify-center gap-2 mt-4">
                  Check Out <ArrowRight className="size-5" />
                </Button>
              </Link>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
