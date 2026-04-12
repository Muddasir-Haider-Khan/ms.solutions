"use client";

import {
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  Package,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/slugs";

// ============================================================
// Types
// ============================================================

interface SalesData {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  averageInvoiceValue: number;
}

interface InventoryData {
  totalProducts: number;
  activeProducts: number;
  totalStockValue: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    quantityInStock: number;
    lowStockThreshold: number;
    sellingPrice: number;
  }>;
  outOfStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    quantityInStock: number;
    lowStockThreshold: number;
    sellingPrice: number;
  }>;
  topSellingProducts: Array<{
    id: string;
    name: string;
    sku: string;
    totalQuantitySold: number;
    totalSalesCount: number;
    sellingPrice: number;
  }>;
}

interface ReportCardsProps {
  salesData: SalesData;
  inventoryData: InventoryData;
}

// ============================================================
// Component
// ============================================================

export function ReportCards({ salesData, inventoryData }: ReportCardsProps) {
  const salesCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(salesData.totalRevenue),
      description: "Paid & sent invoices",
      icon: DollarSign,
      iconColor: "text-green-600",
    },
    {
      title: "Total Invoices",
      value: salesData.totalInvoices.toString(),
      description: "All invoices created",
      icon: FileText,
      iconColor: "text-blue-600",
    },
    {
      title: "Paid Invoices",
      value: salesData.paidInvoices.toString(),
      description: "Successfully paid",
      icon: CheckCircle,
      iconColor: "text-emerald-600",
    },
    {
      title: "Pending Invoices",
      value: salesData.pendingInvoices.toString(),
      description: "Draft or sent, awaiting payment",
      icon: Clock,
      iconColor: "text-amber-600",
    },
  ];

  const inventoryCards = [
    {
      title: "Total Products",
      value: inventoryData.totalProducts.toString(),
      description: `${inventoryData.activeProducts} active`,
      icon: Package,
      iconColor: "text-blue-600",
    },
    {
      title: "Stock Value",
      value: formatCurrency(inventoryData.totalStockValue),
      description: "Based on cost price",
      icon: TrendingUp,
      iconColor: "text-green-600",
    },
    {
      title: "Low Stock",
      value: inventoryData.lowStockProducts.length.toString(),
      description: "Products below threshold",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
    },
    {
      title: "Out of Stock",
      value: inventoryData.outOfStockProducts.length.toString(),
      description: "Zero stock items",
      icon: XCircle,
      iconColor: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sales Summary */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Sales Summary</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {salesCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Inventory Summary */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Inventory Summary</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {inventoryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Top Selling Products */}
      {inventoryData.topSellingProducts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {inventoryData.topSellingProducts.slice(0, 5).map((product, idx) => (
              <Card key={product.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {product.name}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Sold: {product.totalQuantitySold} units</p>
                    <p>Sales: {product.totalSalesCount} invoices</p>
                    <p className="font-medium text-foreground">
                      {formatCurrency(product.sellingPrice)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
