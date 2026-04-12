import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, AlertTriangle, ShoppingCart, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/slugs";

export default async function DashboardPage() {
  const [
    totalProducts,
    stockValueData,
    lowStockProducts,
    outOfStockProducts,
    totalOrders,
    recentOrders,
    recentInvoices,
    totalSales,
  ] = await Promise.all([
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { costPrice: true, quantityInStock: true },
    }),
    prisma.product.count({
      where: {
        status: "ACTIVE",
        trackInventory: true,
        quantityInStock: { lte: 10 },
      },
    }),
    prisma.product.count({
      where: { status: "ACTIVE", trackInventory: true, quantityInStock: 0 },
    }),
    prisma.order.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
    prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["PAID", "SENT"] } },
    }),
  ]);

  const stockValue = stockValueData.reduce(
    (sum, p) => sum + p.costPrice * p.quantityInStock,
    0
  );

  const stats = [
    { title: "Total Products", value: totalProducts.toString(), icon: Package, desc: "Active products" },
    { title: "Stock Value", value: formatCurrency(stockValue), icon: DollarSign, desc: "Based on cost price" },
    { title: "Total Sales", value: formatCurrency(totalSales._sum.totalAmount || 0), icon: TrendingUp, desc: "Paid & sent invoices" },
    { title: "Low Stock", value: lowStockProducts.toString(), icon: AlertTriangle, desc: "Needs reorder" },
    { title: "Out of Stock", value: outOfStockProducts.toString(), icon: Package, desc: "Zero stock items" },
    { title: "Orders", value: totalOrders.toString(), icon: ShoppingCart, desc: "Total orders" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back to Multi Solutions Company management system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(order.totalAmount)}</p>
                      <span className="text-xs rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.customer?.name || inv.billToName || "No customer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(inv.totalAmount)}</p>
                      <span className="text-xs rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
