import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Truck,
  CircleDot,
  Clock,
  XCircle,
  MessageCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getOrder } from "@/actions/store";
import { formatCurrency, formatDate } from "@/lib/slugs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "Order Detail - Multi Solutions Store",
  description: "View your order details and tracking status",
};

const statusConfig: Record<
  string,
  { color: string; bgColor: string; icon: React.ElementType; label: string }
> = {
  PENDING: {
    color: "text-yellow-600",
    bgColor: "bg-yellow-500",
    icon: Clock,
    label: "Pending",
  },
  CONFIRMED: {
    color: "text-blue-600",
    bgColor: "bg-blue-500",
    icon: CheckCircle2,
    label: "Confirmed",
  },
  PROCESSING: {
    color: "text-purple-600",
    bgColor: "bg-purple-500",
    icon: CircleDot,
    label: "Processing",
  },
  SHIPPED: {
    color: "text-indigo-600",
    bgColor: "bg-indigo-500",
    icon: Truck,
    label: "Shipped",
  },
  DELIVERED: {
    color: "text-green-600",
    bgColor: "bg-green-500",
    icon: Package,
    label: "Delivered",
  },
  CANCELLED: {
    color: "text-red-600",
    bgColor: "bg-red-500",
    icon: XCircle,
    label: "Cancelled",
  },
};

const statusFlow = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/customer-login?callbackUrl=/account/orders");
  }

  const { id } = await params;
  const result = await getOrder(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const order = result.data as any;
  const currentStatusIndex = statusFlow.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  // WhatsApp follow-up URL
  const ownerPhone =
    process.env.NEXT_PUBLIC_OWNER_WHATSAPP_NUMBER || "923000000000";
  const waMessage = encodeURIComponent(
    `Hi! I'd like to follow up on my order ${order.orderNumber}. Could you please provide an update?`
  );
  const waUrl = `https://wa.me/${ownerPhone.replace(/[^0-9]/g, "")}?text=${waMessage}`;

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/account/orders"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold md:text-2xl">
              {order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Order Status</CardTitle>
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
                    This order has been cancelled. Contact us for assistance.
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
                  if (status === "PENDING" && order.createdAt) {
                    timestamp = formatDate(order.createdAt);
                  }
                  if (status === "CONFIRMED" && order.confirmedAt) {
                    timestamp = formatDate(order.confirmedAt);
                  }
                  if (status === "SHIPPED" && order.dispatchedAt) {
                    timestamp = formatDate(order.dispatchedAt);
                  }
                  if (status === "DELIVERED" && order.deliveredAt) {
                    timestamp = formatDate(order.deliveredAt);
                  }

                  return (
                    <div key={status} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`flex size-9 items-center justify-center rounded-full transition-colors ${
                            isCompleted
                              ? `${config.bgColor} text-white`
                              : "bg-muted text-muted-foreground"
                          } ${isCurrent ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                        >
                          <Icon className="size-4" />
                        </div>
                        <span
                          className={`text-[10px] font-medium sm:text-xs ${
                            isCompleted
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {config.label}
                        </span>
                        {timestamp && (
                          <span className="hidden text-[9px] text-muted-foreground sm:block">
                            {timestamp}
                          </span>
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={`mx-1 h-0.5 flex-1 rounded sm:mx-2 ${
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

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item: any) => {
                const image = item.product?.images?.[0]?.url;
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {image ? (
                        <img
                          src={image}
                          alt={item.productName}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Package className="size-5 text-muted-foreground/30" />
                        </div>
                      )}
                      <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.productName}
                      </p>
                      {item.productVariant && (
                        <p className="text-xs text-muted-foreground">
                          {item.productVariant.name}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(item.lineTotal)}
                    </span>
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
              <Separator className="my-1" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1 gap-2 bg-[#25D366] text-white hover:bg-[#1da851]"
            render={
              <a href={waUrl} target="_blank" rel="noopener noreferrer" />
            }
          >
            <MessageCircle className="size-4" />
            Contact on WhatsApp
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            render={<Link href="/shop" />}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
