import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getCustomerOrders } from "@/actions/store";
import { formatCurrency, formatDate } from "@/lib/slugs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/slugs";

export const metadata = {
  title: "Your Orders - MS Solutions",
};

const statusConfig: Record<
  string,
  { color: string; icon: React.ElementType }
> = {
  PENDING: {
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  CONFIRMED: {
    color: "bg-blue-100 text-blue-700",
    icon: CheckCircle2,
  },
  PROCESSING: {
    color: "bg-purple-100 text-purple-700",
    icon: Package,
  },
  SHIPPED: {
    color: "bg-indigo-100 text-indigo-700",
    icon: Truck,
  },
  DELIVERED: {
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  CANCELLED: {
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

export default async function CustomerOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/customer-login?callbackUrl=/account/orders");
  }

  // Fetch orders attached to this userId
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            My Orders
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage your order history
          </p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="size-16 text-store-muted/20" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No orders yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Start shopping to see your orders here!
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex items-center rounded-full bg-store-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-store-accent-hover"
              >
                Browse Products
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(orders as any[]).map((order) => {
              const config = statusConfig[order.status] || statusConfig.PENDING;
              const Icon = config.icon;

              return (
                <Link key={order.id} href={`/account/orders/${order.id}`}>
                  <Card className="transition-all hover:shadow-md hover:border-store-accent/20">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-store-accent-light">
                            <Icon className="size-5 text-store-accent" />
                          </div>
                          <div>
                            <p className="font-mono text-sm font-bold text-gray-900">
                              {order.orderNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(order.createdAt)} ·{" "}
                              {order._count.items} item
                              {order._count.items !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${config.color}`}
                          >
                            {order.status}
                          </span>
                          <span className="text-lg font-bold text-store-accent">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
