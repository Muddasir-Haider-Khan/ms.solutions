import {
  getStockSummary,
  getInventoryTransactions,
} from "@/actions/inventory";
import { getProductsForSelect } from "@/actions/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  DollarSign,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/slugs";
import { InventoryClient } from "@/components/admin/inventory-client";

export default async function InventoryPage() {
  const [summaryResult, transactionsResult, productsResult] =
    await Promise.all([
      getStockSummary(),
      getInventoryTransactions({ page: 1, pageSize: 20 }),
      getProductsForSelect(),
    ]);

  // Handle summary errors
  if (!summaryResult.success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Monitor stock levels and manage inventory
          </p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{summaryResult.error}</p>
        </div>
      </div>
    );
  }

  const summary = summaryResult.data;
  const transactions = transactionsResult.success
    ? transactionsResult.data
    : { transactions: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  const products = productsResult.success ? productsResult.data : [];

  const stats = [
    {
      title: "Total Products",
      value: summary.totalProducts.toString(),
      icon: Package,
      description: `${summary.activeProducts} active`,
    },
    {
      title: "Stock Value",
      value: formatCurrency(summary.totalStockValue),
      icon: DollarSign,
      description: `${summary.totalQuantityInStock} total units`,
    },
    {
      title: "Low Stock",
      value: summary.lowStockCount.toString(),
      icon: AlertTriangle,
      description: "Needs reorder",
    },
    {
      title: "Out of Stock",
      value: summary.outOfStockCount.toString(),
      icon: XCircle,
      description: "Zero stock items",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Inventory Management
        </h1>
        <p className="text-muted-foreground">
          Monitor stock levels and manage inventory
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client section: stock adjustment + transactions table */}
      <InventoryClient
        products={products}
        initialTransactions={transactions.transactions}
        initialPagination={transactions.pagination}
      />
    </div>
  );
}
