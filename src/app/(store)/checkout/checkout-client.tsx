"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { placeOrder } from "@/actions/store";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/slugs";
import { useGuestCart } from "@/lib/guest-cart";

function buildWhatsAppMessage(
  orderNumber: string,
  formData: Record<string, string>,
  totalAmount: number
) {
  const lines = [
    `*New Order - ${orderNumber}*`,
    ``,
    `*Customer:* ${formData.customerName}`,
    `*Phone:* ${formData.customerPhone}`,
    formData.customerEmail ? `*Email:* ${formData.customerEmail}` : "",
    ``,
    `*Delivery Address:*`,
    `${formData.shippingAddress}`,
    `${formData.shippingCity}`,
    ``,
    `*Total:* ${formatCurrency(totalAmount)}`,
    `*Payment:* ${
      formData.paymentMethod === "COD" ? "Cash on Delivery" :
      formData.paymentMethod === "BANK_TRANSFER" ? "Bank Transfer" :
      formData.paymentMethod === "JAZZCASH" ? "JazzCash" :
      formData.paymentMethod === "EASYPAISA" ? "EasyPaisa" :
      formData.paymentMethod
    }`,
    formData.notes ? `\n*Notes:* ${formData.notes}` : "",
    ``,
    `---`,
    `_Sent via Multi Solutions Store_`,
  ];

  return lines.filter(Boolean).join("\n");
}

function getWhatsAppUrl(phone: string, message: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function CheckoutClient() {
  const router = useRouter();
  const guestCart = useGuestCart();
  const [isPending, startTransition] = useTransition();
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    notes: "",
    paymentMethod: "COD",
  });

  const cartItems = guestCart.items;
  const subtotal = guestCart.subtotal;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validateForm() {
    if (!formData.customerName.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!formData.customerPhone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (!formData.shippingAddress.trim()) {
      toast.error("Please enter your address");
      return false;
    }
    if (!formData.shippingCity.trim()) {
      toast.error("Please enter your city");
      return false;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty. Add items to checkout.");
      return false;
    }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    startTransition(async () => {
      const result = await placeOrder(getOrderPayload());
      if (result.success && result.data) {
        const orderData = result.data as {
          orderId: string;
          orderNumber: string;
          totalAmount: number;
        };

        toast.success("Order placed successfully!");

        // JazzCash: redirect to payment page
        if (formData.paymentMethod === "JAZZCASH") {
          router.push(
            `/jazzcash-payment?orderId=${orderData.orderId}&amount=${orderData.totalAmount}&orderNumber=${encodeURIComponent(orderData.orderNumber)}`
          );
          return;
        }

        router.push(`/order-success?orderId=${orderData.orderId}`);
      } else {
        toast.error(
          (result as { error?: string }).error || "Failed to place order"
        );
      }
    });
  }

  async function handleWhatsAppOrder() {
    if (!validateForm()) return;

    setWhatsappLoading(true);
    try {
      const result = await placeOrder(getOrderPayload());
      if (result.success && result.data) {
        const orderData = result.data as {
          orderId: string;
          orderNumber: string;
          totalAmount: number;
        };

        const ownerPhone =
          process.env.NEXT_PUBLIC_OWNER_WHATSAPP_NUMBER || "923000000000";
        const message = buildWhatsAppMessage(
          orderData.orderNumber,
          formData,
          orderData.totalAmount
        );
        const waUrl = getWhatsAppUrl(ownerPhone, message);

        window.open(waUrl, "_blank");

        router.push(
          `/order-success?orderId=${orderData.orderId}&whatsapp=true`
        );
      } else {
        toast.error(
          (result as { error?: string }).error || "Failed to place order"
        );
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setWhatsappLoading(false);
    }
  }

  // JazzCash Server-to-Server Checkout Redirect
  async function handleJazzCashOrder() {
    if (!validateForm()) return;

    setWhatsappLoading(true);
    try {
      const result = await placeOrder(getOrderPayload());
      if (result.success && result.data?.jazzcashPayload) {
        toast.success("Redirecting to JazzCash...");
        // Create an invisible form to POST to the JazzCash Endpoint
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
        
        Object.entries(result.data.jazzcashPayload).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        toast.error((result as { error?: string }).error || "Failed to initialize payment");
        setWhatsappLoading(false);
      }
    } catch {
      toast.error("Something went wrong with the payment gateway");
      setWhatsappLoading(false);
    }
  }

  const isLoading = isPending || whatsappLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Shipping Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Full Name <span className="text-store-sale">*</span>
              </Label>
              <Input
                id="shippingAddress"
                name="shippingAddress"
                placeholder="Street address, building, apartment"
                className="h-14 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-base"
                value={formData.shippingAddress}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shippingCity" className="text-sm font-medium">
                  City
                </Label>
                <Input
                  id="shippingCity"
                  name="shippingCity"
                  className="h-14 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-base"
                  value={formData.shippingCity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail" className="text-sm font-medium">
                  Email Address <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  className="h-14 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-base"
                  value={formData.customerEmail}
                  onChange={handleChange}
                />
              </div>
            </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">
              Phone Number <span className="text-store-sale">*</span>
            </Label>
            <Input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              placeholder="+92 300 1234567"
              value={formData.customerPhone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingAddress">
              Shipping Address <span className="text-store-sale">*</span>
            </Label>
            <Textarea
              id="shippingAddress"
              name="shippingAddress"
              placeholder="Enter your complete shipping address"
              value={formData.shippingAddress}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shippingCity">
                City <span className="text-store-sale">*</span>
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Notes for the courier..."
                className="min-h-[100px] rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-base resize-none"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="h-px bg-border/40 w-full" />

          {/* Payment Method Step 2 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Payment Method</h2>
            
            <div className="grid gap-4 sm:grid-cols-3">
              <div 
                onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "COD" }))}
                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all duration-200 ${
                  formData.paymentMethod === "COD" 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-transparent bg-muted/40 hover:bg-muted/80"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 mb-4 flex items-center justify-center transition-colors ${
                  formData.paymentMethod === "COD" ? "border-primary" : "border-muted-foreground/30"
                }`}>
                  {formData.paymentMethod === "COD" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <h3 className="font-semibold text-foreground mb-1">Cash on Delivery</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Pay with cash upon delivery.</p>
              </div>

              <div 
                onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "JAZZCASH" }))}
                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all duration-200 ${
                  formData.paymentMethod === "JAZZCASH" 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-transparent bg-muted/40 hover:bg-muted/80"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 mb-4 flex items-center justify-center transition-colors ${
                  formData.paymentMethod === "JAZZCASH" ? "border-primary" : "border-muted-foreground/30"
                }`}>
                  {formData.paymentMethod === "JAZZCASH" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <h3 className="font-semibold text-foreground mb-1">JazzCash</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Pay securely via your account.</p>
              </div>

              <div 
                onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "BANK_TRANSFER" }))}
                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all duration-200 ${
                  formData.paymentMethod === "BANK_TRANSFER" 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-transparent bg-muted/40 hover:bg-muted/80"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 mb-4 flex items-center justify-center transition-colors ${
                  formData.paymentMethod === "BANK_TRANSFER" ? "border-primary" : "border-muted-foreground/30"
                }`}>
                  {formData.paymentMethod === "BANK_TRANSFER" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <h3 className="font-semibold text-foreground mb-1">Bank Transfer</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Order confirmed after payment.</p>
              </div>
            </div>
          </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value: string | null) =>
              setFormData((prev) => ({
                ...prev,
                paymentMethod: value ?? "COD",
              }))
            }
          >
            <div className="flex items-start gap-3 rounded-xl border p-4 transition-colors hover:border-store-accent/30">
              <RadioGroupItem value="COD" id="cod" />
              <div className="flex-1">
                <Label htmlFor="cod" className="cursor-pointer font-medium">
                  Cash on Delivery (COD)
                </Label>
                <p className="text-xs text-gray-500">
                  Pay when your order arrives at your doorstep
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3 rounded-xl border p-4 transition-colors hover:border-store-accent/30">
              <RadioGroupItem value="BANK_TRANSFER" id="bank" />
              <div className="flex-1">
                <Label htmlFor="bank" className="cursor-pointer font-medium">
                  Bank Transfer
                </Label>
                <p className="text-xs text-gray-500">
                  Transfer payment directly to our bank account. Order will be
                  confirmed after payment verification.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3 rounded-xl border p-4 transition-colors hover:border-store-accent/30">
              <RadioGroupItem value="JAZZCASH" id="jazzcash" />
              <div className="flex-1">
                <Label htmlFor="jazzcash" className="cursor-pointer font-medium">
                  JazzCash
                </Label>
                <p className="text-xs text-gray-500">
                  Pay securely via JazzCash mobile wallet. You will be redirected to complete payment.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3 rounded-xl border p-4 transition-colors hover:border-store-accent/30">
              <RadioGroupItem value="EASYPAISA" id="easypaisa" />
              <div className="flex-1">
                <Label htmlFor="easypaisa" className="cursor-pointer font-medium">
                  EasyPaisa
                </Label>
                <p className="text-xs text-gray-500">
                  Pay securely via EasyPaisa mobile wallet.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1da851] disabled:opacity-50"
          onClick={handleWhatsAppOrder}
          disabled={isLoading}
        >
          {whatsappLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending to WhatsApp...
            </>
          ) : (
            <>
              <MessageCircle className="size-5" />
              Order via WhatsApp
            </>
          )}
        </button>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-store-accent px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover disabled:opacity-50"
          disabled={isLoading}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Placing Order...
            </>
          ) : (
            "Place Order (Standard)"
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          WhatsApp order lets you confirm directly with us — fastest way to
          order!
        </p>
      </div>

      {/* Order Summary Sidebar */}
      <div className="w-full bg-white border border-[#D5D9D9] rounded-lg p-5 self-start sticky top-24">
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
  );
}
