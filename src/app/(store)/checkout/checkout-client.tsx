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
    `*Payment:* ${formData.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer"}`,
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
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    startTransition(async () => {
      const result = await placeOrder(formData);
      if (result.success && result.data) {
        const orderData = result.data as {
          orderId: string;
          orderNumber: string;
        };
        toast.success("Order placed successfully!");
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
      const result = await placeOrder(formData);
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
                id="customerName"
                name="customerName"
                placeholder="Enter your full name"
                value={formData.customerName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email Address</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                placeholder="your@email.com"
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
              <Input
                id="shippingCity"
                name="shippingCity"
                placeholder="Enter your city"
                value={formData.shippingCity}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any special instructions for your order"
              value={formData.notes}
              onChange={handleChange}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

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
    </form>
  );
}
