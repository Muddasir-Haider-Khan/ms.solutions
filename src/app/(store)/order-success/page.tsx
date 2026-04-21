import Link from "next/link";
import {
  CheckCircle,
  ShoppingBag,
  Package,
  MessageCircle,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
            <Package className="mx-auto size-12 text-store-muted/30" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No order found
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Invalid or missing order ID.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center rounded-full bg-store-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover"
            >
              Continue Shopping
            </Link>
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
            <Package className="mx-auto size-12 text-store-muted/30" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Order not found
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              This order may have been removed or doesn&apos;t exist.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center rounded-full bg-store-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover"
            >
              Continue Shopping
            </Link>
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

  const ownerPhone =
    process.env.NEXT_PUBLIC_OWNER_WHATSAPP_NUMBER || "923000000000";
  const waMessage = encodeURIComponent(
    [
      `*Order Follow-up - ${typedOrder.orderNumber}*`,
      ``,
      `Hi! I placed order ${typedOrder.orderNumber} and would like to confirm.`,
      ``,
      `${typedOrder.customerName}`,
      `${typedOrder.customerPhone || "N/A"}`,
      `Total: ${formatCurrency(typedOrder.totalAmount)}`,
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
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            {isWhatsApp
              ? "Order Sent to WhatsApp!"
              : "Order Placed Successfully!"}
          </h1>
          <p className="mt-2 text-gray-500">
            {isWhatsApp
              ? "Complete your order by sending the WhatsApp message. We'll confirm shortly!"
              : "Thank you for your order. We'll process it right away."}
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="mb-6 border-t-4 border-t-store-success">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-mono text-lg font-bold text-gray-900">
                  {typedOrder.orderNumber}
                </p>
              </div>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                {typedOrder.status}
              </span>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              {typedOrder.items.map((item) => {
                const image = item.product?.images?.[0];
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-store-light-bg">
                      {image ? (
                        <img
                          src={image.url}
                          alt={image.altText || item.productName}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Package className="size-5 text-store-muted/30" />
                        </div>
                      )}
                      <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-store-accent text-[10px] font-bold text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-gray-900">
                        {item.productName}
                      </p>
                      {item.productVariant && (
                        <p className="text-xs text-gray-400">
                          {item.productVariant.name}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </div>
                );
              })}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">
                  {formatCurrency(typedOrder.subtotal)}
                </span>
              </div>
              {typedOrder.shippingFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-gray-900">
                    {formatCurrency(typedOrder.shippingFee)}
                  </span>
                </div>
              )}
              {typedOrder.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">
                    {formatCurrency(typedOrder.taxAmount)}
                  </span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-store-accent">
                  {formatCurrency(typedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-gray-500">Delivery To</p>
                <p className="font-medium text-gray-900">
                  {typedOrder.customerName}
                </p>
                {typedOrder.shippingAddress && (
                  <p className="text-gray-500">{typedOrder.shippingAddress}</p>
                )}
                {typedOrder.shippingCity && (
                  <p className="text-gray-500">{typedOrder.shippingCity}</p>
                )}
              </div>
              <div>
                <p className="text-gray-500">Payment Method</p>
                <p className="font-medium text-gray-900">
                  {typedOrder.paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : "Bank Transfer"}
                </p>
                <p className="text-gray-500">
                  Ordered {formatDate(typedOrder.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1da851]"
          >
            <MessageCircle className="size-5" />
            {isWhatsApp ? "Open WhatsApp Again" : "Contact on WhatsApp"}
          </a>

          <Link
            href="/account/orders"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-store-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover"
          >
            <ClipboardList className="size-4" />
            Track My Orders
          </Link>

          <Link
            href="/shop"
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
          >
            <ShoppingBag className="size-4" />
            Continue Shopping
          </Link>
        </div>

        {isWhatsApp && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm font-medium text-green-800">
              Don&apos;t forget to send the WhatsApp message to complete your
              order!
            </p>
            <p className="mt-1 text-xs text-green-600">
              Your order is saved as PENDING until we receive your WhatsApp
              confirmation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
