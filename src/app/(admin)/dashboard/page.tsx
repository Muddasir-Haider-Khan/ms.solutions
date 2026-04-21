import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, DollarSign, AlertTriangle, ShoppingCart, TrendingUp, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/slugs";
import { Badge } from "@/components/ui/badge";

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
    { title: "Total Products", value: totalProducts.toString(), icon: Package, desc: "Active products on store" },
    { title: "Stock Value", value: formatCurrency(stockValue), icon: DollarSign, desc: "Capital based on cost price" },
    { title: "Total Sales", value: formatCurrency(totalSales._sum.totalAmount || 0), icon: TrendingUp, desc: "Total revenue generated" },
    { title: "Low Stock", value: lowStockProducts.toString(), icon: AlertTriangle, desc: "Items below safe threshold", alert: true },
    { title: "Out of Stock", value: outOfStockProducts.toString(), icon: Package, desc: "Operations halted items", danger: true },
    { title: "Total Orders", value: totalOrders.toString(), icon: ShoppingCart, desc: "Orders placed" },
  ];

  return (
    <div className="space-y-8 bg-background min-h-screen text-foreground pb-12">
      
      {/* Header section */}
      <div className="flex justify-between items-end pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your store's operations and finances.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="rounded-2xl border-none shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all bg-card flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full flex items-center justify-center ${stat.danger ? 'bg-destructive/10 text-destructive' : stat.alert ? 'bg-amber-100/50 text-amber-600' : 'bg-primary/5 text-primary'}`}>
                 <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className={`text-3xl font-bold tracking-tighter ${stat.danger ? 'text-destructive' : stat.alert ? 'text-amber-600' : 'text-foreground'}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-none shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recent Orders</CardTitle>
            <CardDescription>Latest customer transactions from the storefront.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center border-2 border-dashed rounded-xl">
                 <ShoppingCart className="size-8 text-muted-foreground mb-3 opacity-20" />
                 <p className="text-sm text-muted-foreground font-medium">No orders yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="size-10 bg-background rounded-full shadow-sm flex items-center justify-center">
                          <Package className="size-4 text-muted-foreground" />
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                         <p className="text-xs text-muted-foreground mt-0.5">{order.customerName}</p>
                       </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
                      <Badge variant={
                          order.status === "DELIVERED" ? "default" :
                          order.status === "PENDING" ? "secondary" : "outline"
                      } className="mt-1.5 text-[10px] uppercase font-bold tracking-wider rounded-sm px-1.5 py-0">
                         {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recent Invoices</CardTitle>
            <CardDescription>Latest generated bills from the management system.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            {recentInvoices.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center border-2 border-dashed rounded-xl">
                 <CreditCard className="size-8 text-muted-foreground mb-3 opacity-20" />
                 <p className="text-sm text-muted-foreground font-medium">No invoices yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                     <div className="flex items-center gap-4">
                       <div className="size-10 bg-background rounded-full shadow-sm flex items-center justify-center">
                          <CreditCard className="size-4 text-muted-foreground" />
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-foreground">{inv.invoiceNumber}</p>
                         <p className="text-xs text-muted-foreground mt-0.5">
                           {inv.customer?.name || inv.billToName || "No customer"}
                         </p>
                       </div>
                     </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(inv.totalAmount)}</p>
                      <Badge variant={
                          inv.status === "PAID" ? "default" :
                          inv.status === "VOID" ? "destructive" : "outline"
                      } className="mt-1.5 text-[10px] uppercase font-bold tracking-wider rounded-sm px-1.5 py-0">
                         {inv.status}
                      </Badge>
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
