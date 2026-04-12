"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { placeOrder } from "@/actions/store";
import { toast } from "sonner";

export function CheckoutClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Basic validation
    if (!formData.customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.customerPhone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!formData.shippingAddress.trim()) {
      toast.error("Please enter your address");
      return;
    }
    if (!formData.shippingCity.trim()) {
      toast.error("Please enter your city");
      return;
    }

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shipping Information */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Full Name <span className="text-destructive">*</span>
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
              Phone Number <span className="text-destructive">*</span>
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
              Shipping Address <span className="text-destructive">*</span>
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
                City <span className="text-destructive">*</span>
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

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value: string | null) =>
              setFormData((prev) => ({ ...prev, paymentMethod: value ?? "COD" }))
            }
          >
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <RadioGroupItem value="COD" id="cod" />
              <div className="flex-1">
                <Label htmlFor="cod" className="cursor-pointer font-medium">
                  Cash on Delivery (COD)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pay when your order arrives at your doorstep
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3 rounded-lg border p-4">
              <RadioGroupItem value="BANK_TRANSFER" id="bank" />
              <div className="flex-1">
                <Label htmlFor="bank" className="cursor-pointer font-medium">
                  Bank Transfer
                </Label>
                <p className="text-xs text-muted-foreground">
                  Transfer payment directly to our bank account. Order will be
                  confirmed after payment verification.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Placing Order...
          </>
        ) : (
          "Place Order"
        )}
      </Button>
    </form>
  );
}
