"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type InvoiceOrderData = {
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Date | string;
  items: {
    productName: string;
    productSku?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};

export function InvoicePDFButton({
  order,
  variant = "outline",
  size = "default",
  className,
}: {
  order: InvoiceOrderData;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      // Dynamic import to keep bundle size small
      const { generateInvoicePDF } = await import("@/lib/generate-invoice");
      generateInvoicePDF({
        ...order,
        businessName: "Multi Solutions Company",
        businessAddress: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "",
        businessPhone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "",
        businessEmail: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "",
      });
      toast.success("Invoice PDF downloaded!");
    } catch {
      toast.error("Failed to generate invoice PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Download Invoice
    </Button>
  );
}
