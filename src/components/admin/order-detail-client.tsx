"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Truck,
  CircleDot,
  Clock,
  XCircle,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { InvoicePDFButton } from "@/components/admin/invoice-pdf-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { updateOrderStatus } from "@/actions/orders";
import { formatCurrency, formatDate } from "@/lib/slugs";
import { toast } from "sonner";

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingNotes: string | null;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  notes: string | null;
  confirmedAt: Date | string | null;
  dispatchedAt: Date | string | null;
  deliveredAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  items: {
    id: string;
    productName: string;
    productSku: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product?: {
      id: string;
      name: string;
      slug: string;
      sku: string;
      images?: { url: string; altText?: string | null }[];
    } | null;
    productVariant?: {
      id: string;
      name: string;
      sku: string;
      image?: string | null;
    } | null;
  }[];
  customer?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

const statusConfig: Record<
  string,
  { color: string; icon: React.ElementType; label: string }
> = {
  PENDING: { color: "bg-yellow-500", icon: Clock, label: "Pending" },
  CONFIRMED: { color: "bg-blue-500", icon: CheckCircle2, label: "Confirmed" },
  PROCESSING: { color: "bg-purple-500", icon: CircleDot, label: "Processing" },
  SHIPPED: { color: "bg-indigo-500", icon: Truck, label: "Shipped" },
  DELIVERED: { color: "bg-green-500", icon: Package, label: "Delivered" },
  CANCELLED: { color: "bg-red-500", icon: XCircle, label: "Cancelled" },
};

const statusFlow = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

function formatTimestamp(date: Date | string | null) {
  if (!date) return null;
  return new Date(date).toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetailClient({ order }: { order: OrderDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentStatusIndex = statusFlow.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  function handleStatusUpdate(newStatus: string) {
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus);
      if (result.success) {
        toast.success(`Order status updated to ${newStatus}`);
        router.refresh();
      } else {
        toast.error(
          (result as { error?: string }).error || "Failed to update status"
        );
      }
    });
  }

  // Figure out the next logical action
  function getNextAction(): { label: string; status: string; variant: "default" | "destructive" } | null {
    if (isCancelled) return null;
    switch (order.status) {
      case "PENDING":
        return { label: "Confirm Order", status: "CONFIRMED", variant: "default" };
      case "CONFIRMED":
        return { label: "Start Processing", status: "PROCESSING", variant: "default" };
      case "PROCESSING":
        return { label: "Mark as Shipped", status: "SHIPPED", variant: "default" };
      case "SHIPPED":
        return { label: "Mark as Delivered", status: "DELIVERED", variant: "default" };
      default:
        return null;
    }
  }

  const nextAction = getNextAction();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/orders" />}
            nativeButton={false}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Placed on {formatTimestamp(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InvoicePDFButton order={order} />
          {nextAction && (
            <Button
              onClick={() => handleStatusUpdate(nextAction.status)}
              disabled={isPending}
              variant={nextAction.variant}
            >
              {nextAction.label}
            </Button>
          )}
          {!isCancelled && order.status !== "DELIVERED" && (
            <Button
              variant="destructive"
              size="default"
              onClick={() => handleStatusUpdate("CANCELLED")}
              disabled={isPending}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isCancelled ? (
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-950/30">
              <XCircle className="size-6 text-red-500" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">
                  Order Cancelled
                </p>
                <p className="text-sm text-red-600 dark:text-red-500">
                  This order has been cancelled and stock has been restored.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {statusFlow.map((status, index) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const isLast = index === statusFlow.length - 1;

                let timestamp: string | null = null;
                if (status === "PENDING") timestamp = formatTimestamp(order.createdAt);
                if (status === "CONFIRMED") timestamp = formatTimestamp(order.confirmedAt);
                if (status === "SHIPPED") timestamp = formatTimestamp(order.dispatchedAt);
                if (status === "DELIVERED") timestamp = formatTimestamp(order.deliveredAt);

                return (
                  <div key={status} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`flex size-10 items-center justify-center rounded-full transition-colors ${
                          isCompleted
                            ? `${config.color} text-white`
                            : "bg-muted text-muted-foreground"
                        } ${isCurrent ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {config.label}
                      </span>
                      {timestamp && (
                        <span className="text-[10px] text-muted-foreground">
                          {timestamp}
                        </span>
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`mx-2 h-0.5 flex-1 rounded ${
                          index < currentStatusIndex
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const image =
                    item.productVariant?.image ||
                    item.product?.images?.[0]?.url;
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {image ? (
                          <img
                            src={image}
                            alt={item.productName}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Package className="size-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        {item.productVariant && (
                          <p className="text-xs text-muted-foreground">
                            Variant: {item.productVariant.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.productSku || "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(item.lineTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                {order.shippingFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatCurrency(order.shippingFee)}</span>
                  </div>
                )}
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(order.taxAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{order.customerName}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {order.customerPhone}
                  </a>
                </div>
              )}
              {order.customerEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {order.customerEmail}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.shippingAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p>{order.shippingAddress}</p>
                    {order.shippingCity && (
                      <p className="text-muted-foreground">
                        {order.shippingCity}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {order.shippingNotes && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Delivery Notes
                  </p>
                  <p className="mt-1 text-sm">{order.shippingNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">
                  {order.paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={
                    order.paymentStatus === "PAID"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }
                >
                  {order.paymentStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
