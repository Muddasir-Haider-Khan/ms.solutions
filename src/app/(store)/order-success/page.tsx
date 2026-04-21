import Link from "next/link";
import {
  CheckCircle,
  ShoppingBag,
  Package,
  MessageCircle,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getOrder } from "@/actions/store";
import { formatCurrency, formatDate } from "@/lib/slugs";

export const metadata = {
  title: "Order Confirmed - MS Solutions",
  description: "Your order has been placed successfully",
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; whatsapp?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.orderId;
  const isWhatsApp = params.whatsapp === "true";

  if (!orderId) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <Package className="mx-auto size-12 text-muted-foreground/30" />
            <h2 className="mt-4 text-lg font-semibold">No order found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Invalid or missing order ID.
            </p>
            <Button className="mt-6" render={<Link href="/shop" />} nativeButton={false}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = await getOrder(orderId);
  const order = result.success ? result.data : null;

  if (!order) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <Package className="mx-auto size-12 text-muted-foreground/30" />
            <h2 className="mt-4 text-lg font-semibold">Order not found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This order may have been removed or doesn&apos;t exist.
            </p>
            <Button className="mt-6" render={<Link href="/shop" />} nativeButton={false}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typedOrder = order as {
    id: string;
    orderNumber: string;
    status: string;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    shippingAddress?: string | null;
    shippingCity?: string | null;
    subtotal: number;
    shippingFee: number;
    taxAmount: number;
    totalAmount: number;
    paymentMethod: string;
    createdAt: Date | string;
    items: {
      id: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      product?: {
        name: string;
        slug: string;
        images?: { url: string; altText?: string | null }[];
      } | null;
      productVariant?: { name: string } | null;
    }[];
  };

  // Build WhatsApp re-send URL
  const ownerPhone =
    process.env.NEXT_PUBLIC_OWNER_WHATSAPP_NUMBER || "923000000000";
  const waMessage = encodeURIComponent(
    [
      `🛒 *Order Follow-up - ${typedOrder.orderNumber}*`,
      ``,
      `Hi! I placed order ${typedOrder.orderNumber} and would like to confirm.`,
      ``,
      `👤 ${typedOrder.customerName}`,
      `📞 ${typedOrder.customerPhone || "N/A"}`,
      `💰 Total: ${formatCurrency(typedOrder.totalAmount)}`,
    ].join("\n")
  );
  const waUrl = `https://wa.me/${ownerPhone.replace(/[^0-9]/g, "")}?text=${waMessage}`;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="size-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">
            {isWhatsApp
              ? "Order Sent to WhatsApp! 🎉"
              : "Order Placed Successfully! 🎉"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isWhatsApp
              ? "Complete your order by sending the WhatsApp message. We'll confirm shortly!"
              : "Thank you for your order. We'll process it right away."}
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Order Info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-mono text-lg font-bold">
                  {typedOrder.orderNumber}
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              >
                {typedOrder.status}
              </Badge>
            </div>

            <Separator className="my-4" />

            {/* Items */}
            <div className="space-y-3">
              {typedOrder.items.map((item) => {
                const image = item.product?.images?.[0];
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {image ? (
                        <img
                          src={image.url}
                          alt={image.altText || item.productName}
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

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(typedOrder.subtotal)}</span>
              </div>
              {typedOrder.shippingFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(typedOrder.shippingFee)}</span>
                </div>
              )}
              {typedOrder.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(typedOrder.taxAmount)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(typedOrder.totalAmount)}</span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Delivery Info */}
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Delivery To</p>
                <p className="font-medium">{typedOrder.customerName}</p>
                {typedOrder.shippingAddress && (
                  <p className="text-muted-foreground">
                    {typedOrder.shippingAddress}
                  </p>
                )}
                {typedOrder.shippingCity && (
                  <p className="text-muted-foreground">
                    {typedOrder.shippingCity}
                  </p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium">
                  {typedOrder.paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : "Bank Transfer"}
                </p>
                <p className="text-muted-foreground">
                  Ordered {formatDate(typedOrder.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* WhatsApp button — always visible */}
          <Button
            className="flex-1 gap-2 bg-[#25D366] text-white hover:bg-[#1da851]"
            size="lg"
            render={
              <a href={waUrl} target="_blank" rel="noopener noreferrer" />
            }
            nativeButton={false}
          >
            <MessageCircle className="size-5" />
            {isWhatsApp ? "Open WhatsApp Again" : "Contact on WhatsApp"}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2"
            render={<Link href="/account/orders" />}
            nativeButton={false}
          >
            <ClipboardList className="size-4" />
            Track My Orders
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2"
            render={<Link href="/shop" />}
            nativeButton={false}
          >
            <ShoppingBag className="size-4" />
            Continue Shopping
          </Button>
        </div>

        {/* WhatsApp reminder for WA orders */}
        {isWhatsApp && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950/30">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              📱 Don&apos;t forget to send the WhatsApp message to complete your
              order!
            </p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
              Your order is saved as PENDING until we receive your WhatsApp
              confirmation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
