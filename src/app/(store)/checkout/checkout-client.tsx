"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    `🛒 *New Order - ${orderNumber}*`,
    ``,
    `👤 *Customer:* ${formData.customerName}`,
    `📞 *Phone:* ${formData.customerPhone}`,
    formData.customerEmail ? `📧 *Email:* ${formData.customerEmail}` : "",
    ``,
    `📍 *Delivery Address:*`,
    `${formData.shippingAddress}`,
    `${formData.shippingCity}`,
    ``,
    `💰 *Total:* ${formatCurrency(totalAmount)}`,
    `💳 *Payment:* ${formData.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer"}`,
    formData.notes ? `\n📝 *Notes:* ${formData.notes}` : "",
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

  function getOrderPayload() {
    const guestItems = guestCart.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId || undefined,
      quantity: i.quantity,
    }));
    
    const payload = { ...formData, guestItems: guestItems.length > 0 ? guestItems : undefined };
    if (!payload.customerEmail || payload.customerEmail.trim() === "") {
        delete (payload as unknown as { customerEmail?: string }).customerEmail;
    }
    return payload;
  }

  // Standard order placement
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    startTransition(async () => {
      const result = await placeOrder(getOrderPayload());
      if (result.success && result.data) {
        toast.success("Order placed successfully!");
        guestCart.clearCart();
        router.push(`/order-success?orderId=${result.data.orderId}`);
      } else {
        toast.error(
          (result as { error?: string }).error || "Failed to place order"
        );
      }
    });
  }

  // WhatsApp order: save to DB first, then redirect to wa.me
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

        // Build WhatsApp message
        const ownerPhone = process.env.NEXT_PUBLIC_OWNER_WHATSAPP_NUMBER || "923000000000";
        const message = buildWhatsAppMessage(
          orderData.orderNumber,
          formData,
          orderData.totalAmount
        );
        const waUrl = getWhatsAppUrl(ownerPhone, message);

        // Open WhatsApp in new tab
        window.open(waUrl, "_blank");

        // Then navigate to success page
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
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Checkout Form */}
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-12 max-w-3xl mx-auto">
          {/* Shipping Information Step 1 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Shipping Details</h2>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="customerName"
                  name="customerName"
                  placeholder="First and Last name"
                  className="h-14 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-base"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="text-sm font-medium">
                  Mobile Number
                </Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  placeholder="Phone number"
                  className="h-14 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-base"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingAddress" className="text-sm font-medium">
                Address
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
              <Label htmlFor="notes" className="text-sm font-medium">
                Delivery Instructions <span className="text-muted-foreground font-normal">(Optional)</span>
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

          <div className="h-px bg-border/40 w-full" />

          {/* Submit Buttons */}
          <div className="bg-card rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Ready to complete your order?</h2>
              <p className="text-sm text-muted-foreground">By placing your order, you agree to our privacy notice and conditions of use.</p>
            </div>
            
            <Button
              type="button"
              onClick={
                formData.paymentMethod === "JAZZCASH" 
                  ? handleJazzCashOrder 
                  : formData.paymentMethod === "COD" 
                    ? handleWhatsAppOrder 
                    : handleSubmit
              }
              disabled={isLoading || cartItems.length === 0}
              className="w-full sm:w-auto min-w-[200px] h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              {whatsappLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : formData.paymentMethod === "JAZZCASH" ? (
                "Proceed to JazzCash"
              ) : formData.paymentMethod === "COD" ? (
                "Place Order via WhatsApp"
              ) : (
                "Place Order"
              )}
            </Button>
          </div>
        </form>
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
