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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCustomerOrders } from "@/actions/store";
import { formatCurrency, formatDate } from "@/lib/slugs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "My Orders - Multi Solutions Store",
  description: "Track your orders and view order history",
};

const statusConfig: Record<string, { color: string; icon: React.ElementType }> =
  {
    PENDING: {
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: Clock,
    },
    CONFIRMED: {
      color:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      icon: CheckCircle2,
    },
    PROCESSING: {
      color:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      icon: Package,
    },
    SHIPPED: {
      color:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
      icon: Truck,
    },
    DELIVERED: {
      color:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      icon: CheckCircle2,
    },
    CANCELLED: {
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: XCircle,
    },
  };

export default async function CustomerOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/customer-login?callbackUrl=/account/orders");
  }

  const result = await getCustomerOrders();
  const orders = result.success && result.data ? result.data : [];

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">My Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage your order history
          </p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="size-16 text-muted-foreground/20" />
              <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Start shopping to see your orders here!
              </p>
              <Button className="mt-6" render={<Link href="/shop" />}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(orders as any[]).map((order) => {
              const config = statusConfig[order.status] || statusConfig.PENDING;
              const Icon = config.icon;

              return (
                <Link key={order.id} href={`/account/orders/${order.id}`}>
                  <Card className="transition-all hover:shadow-md hover:border-primary/20">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left: Order info */}
                        <div className="flex items-center gap-4">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                            <Icon className="size-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-mono text-sm font-bold">
                              {order.orderNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(order.createdAt)} ·{" "}
                              {order._count.items} item
                              {order._count.items !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        {/* Right: Status and total */}
                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                          <Badge
                            variant="outline"
                            className={`text-xs ${config.color}`}
                          >
                            {order.status}
                          </Badge>
                          <span className="text-lg font-bold">
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
