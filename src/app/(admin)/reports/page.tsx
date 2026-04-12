import { getSalesSummary, getInventoryReport } from "@/actions/reports";
import { ReportCards } from "@/components/admin/report-cards";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  ShoppingCart,
  Package,
  BarChart3,
} from "lucide-react";

export const metadata = {
  title: "Reports - Admin",
  description: "Business reports and analytics",
};

export default async function ReportsPage() {
  const [salesResult, inventoryResult] = await Promise.all([
    getSalesSummary(),
    getInventoryReport(),
  ]);

  const salesData = salesResult.success && salesResult.data
    ? salesResult.data
    : {
        totalRevenue: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        averageInvoiceValue: 0,
      };

  const inventoryData = inventoryResult.success && inventoryResult.data
    ? inventoryResult.data
    : {
        totalProducts: 0,
        activeProducts: 0,
        totalStockValue: 0,
        lowStockProducts: [],
        outOfStockProducts: [],
        topSellingProducts: [],
      };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Business analytics and reporting dashboard
        </p>
      </div>

      <ReportCards salesData={salesData} inventoryData={inventoryData} />

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Detailed Reports</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/reports/sales">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sales Report
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Revenue trends, top sellers, payment analysis
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports/invoices">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Invoice Report
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Invoice status breakdown, payment tracking
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports/orders">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Order Report
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Order fulfillment, status breakdown
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports/inventory-movement">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Stock Movement
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Stock in/out history, adjustments log
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
