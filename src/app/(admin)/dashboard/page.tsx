import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Package,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Users,
  FileText,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
} from "lucide-react";
import { formatCurrency } from "@/lib/slugs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:    "bg-yellow-100 text-yellow-700",
    CONFIRMED:  "bg-blue-100 text-blue-700",
    PROCESSING: "bg-purple-100 text-purple-700",
    SHIPPED:    "bg-indigo-100 text-indigo-700",
    DELIVERED:  "bg-green-100 text-green-700",
    CANCELLED:  "bg-red-100 text-red-700",
    DRAFT:      "bg-gray-100 text-gray-600",
    SENT:       "bg-blue-100 text-blue-700",
    PAID:       "bg-green-100 text-green-700",
    OVERDUE:    "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role ?? "";

  const [
    totalProducts,
    stockValueData,
    lowStockProducts,
    outOfStockProducts,
    totalOrders,
    totalCustomers,
    recentOrders,
    recentInvoices,
    totalSales,
    pendingOrders,
    totalOrderRevenue,
    monthlyOrders,
  ] = await Promise.all([
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { costPrice: true, quantityInStock: true },
    }),
    prisma.product.count({
      where: { status: "ACTIVE", trackInventory: true, quantityInStock: { gt: 0, lte: 10 } },
    }),
    prisma.product.count({
      where: { status: "ACTIVE", trackInventory: true, quantityInStock: 0 },
    }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, orderNumber: true, customerName: true,
        totalAmount: true, status: true, createdAt: true,
        paymentMethod: true,
      },
    }),
    prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
    prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["PAID", "SENT"] } },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  const stockValue = stockValueData.reduce(
    (sum, p) => sum + p.costPrice * p.quantityInStock,
    0
  );

  const isAdminOrAbove = ["SUPER_ADMIN", "ADMIN"].includes(userRole);

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Welcome back — here&apos;s what&apos;s happening with Multi Solutions today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingOrders > 0 && (
            <Link
              href="/orders"
              className="flex items-center gap-1.5 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-[12px] font-semibold text-yellow-700 hover:bg-yellow-100 transition-colors"
            >
              <Clock className="size-3.5" />
              {pendingOrders} pending order{pendingOrders !== 1 ? "s" : ""}
            </Link>
          )}
          {lowStockProducts > 0 && (
            <Link
              href="/inventory"
              className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-[12px] font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="size-3.5" />
              {lowStockProducts} low stock
            </Link>
          )}
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Total Products */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Products</p>
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#e0f2f1]">
              <Package className="size-4 text-[#00796b]" />
            </div>
          </div>
          <p className="mt-3 text-[28px] font-bold tracking-tight text-foreground">{totalProducts}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">Active listings</p>
        </div>

        {/* E-commerce Revenue */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">E-com Revenue</p>
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#e0f2f1]">
              <ShoppingCart className="size-4 text-[#00796b]" />
            </div>
          </div>
          <p className="mt-3 text-[28px] font-bold tracking-tight text-foreground">
            {formatCurrency(totalOrderRevenue._sum.totalAmount || 0)}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{totalOrders} total orders · {monthlyOrders} this month</p>
        </div>

        {/* Invoice Sales — admin+ only */}
        {isAdminOrAbove && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice Sales</p>
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#e0f2f1]">
                <TrendingUp className="size-4 text-[#00796b]" />
              </div>
            </div>
            <p className="mt-3 text-[28px] font-bold tracking-tight text-foreground">
              {formatCurrency(totalSales._sum.totalAmount || 0)}
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Paid & sent invoices</p>
          </div>
        )}

        {/* Stock Value */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Stock Value</p>
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#e0f2f1]">
              <DollarSign className="size-4 text-[#00796b]" />
            </div>
          </div>
          <p className="mt-3 text-[28px] font-bold tracking-tight text-foreground">{formatCurrency(stockValue)}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">Based on cost price</p>
        </div>

        {/* Customers — admin+ only */}
        {isAdminOrAbove && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Customers</p>
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#e0f2f1]">
                <Users className="size-4 text-[#00796b]" />
              </div>
            </div>
            <p className="mt-3 text-[28px] font-bold tracking-tight text-foreground">{totalCustomers}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Registered accounts</p>
          </div>
        )}

        {/* Out of Stock Alert */}
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-red-600/80">Out of Stock</p>
            <div className="flex size-9 items-center justify-center rounded-lg bg-red-100">
              <XCircle className="size-4 text-red-500" />
            </div>
          </div>
          <p className="mt-3 text-[28px] font-bold tracking-tight text-red-600">{outOfStockProducts}</p>
          <p className="mt-0.5 text-[12px] text-red-500/80">Items need restocking</p>
        </div>

        {/* Low Stock Alert */}
        <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-yellow-700/80">Low Stock</p>
            <div className="flex size-9 items-center justify-center rounded-lg bg-yellow-100">
              <AlertTriangle className="size-4 text-yellow-600" />
            </div>
          </div>
          <p className="mt-3 text-[28px] font-bold tracking-tight text-yellow-700">{lowStockProducts}</p>
          <p className="mt-0.5 text-[12px] text-yellow-600/80">≤ 10 units remaining</p>
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Add Product",   href: "/products/new",   icon: Package,   color: "text-[#00796b]", bg: "bg-[#e0f2f1]" },
          { label: "New Order",     href: "/orders",         icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
          ...(isAdminOrAbove ? [
            { label: "New Invoice",   href: "/invoices/new",  icon: FileText,  color: "text-purple-600", bg: "bg-purple-50" },
            { label: "View Reports",  href: "/reports",       icon: TrendingUp,color: "text-orange-600", bg: "bg-orange-50" },
          ] : []),
        ].map(({ label, href, icon: Icon, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`size-4 ${color}`} />
            </div>
            <span className="text-[13px] font-semibold text-foreground">{label}</span>
          </Link>
        ))}
      </div>

      {/* ── Recent Tables ───────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-[14px] font-semibold text-foreground">Recent Orders</h2>
            <Link href="/orders" className="flex items-center gap-1 text-[12px] font-medium text-[#00796b] hover:underline">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="divide-y">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ShoppingCart className="size-10 text-gray-200" />
                <p className="mt-3 text-[13px] text-muted-foreground">No orders yet</p>
                <p className="text-[12px] text-muted-foreground/60">Orders will appear here when customers check out</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">{order.orderNumber}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{order.customerName}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-[13px] font-bold text-foreground">{formatCurrency(order.totalAmount)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Invoices — admin+ only */}
        {isAdminOrAbove ? (
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-[14px] font-semibold text-foreground">Recent Invoices</h2>
              <Link href="/invoices" className="flex items-center gap-1 text-[12px] font-medium text-[#00796b] hover:underline">
                View all <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="divide-y">
              {recentInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="size-10 text-gray-200" />
                  <p className="mt-3 text-[13px] text-muted-foreground">No invoices yet</p>
                  <p className="text-[12px] text-muted-foreground/60">Create your first invoice to get started</p>
                </div>
              ) : (
                recentInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">{inv.invoiceNumber}</p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {inv.customer?.name || inv.billToName || "No customer"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="text-[13px] font-bold text-foreground">{formatCurrency(inv.totalAmount)}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Staff: show inventory alerts instead */
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-[14px] font-semibold text-foreground">Inventory Alerts</h2>
              <Link href="/inventory" className="flex items-center gap-1 text-[12px] font-medium text-[#00796b] hover:underline">
                Manage <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="p-5 space-y-3">
              {outOfStockProducts > 0 ? (
                <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
                  <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  <div>
                    <p className="text-[13px] font-semibold text-red-700">{outOfStockProducts} out-of-stock items</p>
                    <p className="text-[12px] text-red-500">These products cannot be sold until restocked</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3">
                  <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600" />
                  <p className="text-[13px] font-semibold text-green-700">No out-of-stock items</p>
                </div>
              )}
              {lowStockProducts > 0 && (
                <div className="flex items-start gap-3 rounded-lg bg-yellow-50 p-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-600" />
                  <div>
                    <p className="text-[13px] font-semibold text-yellow-700">{lowStockProducts} low-stock items</p>
                    <p className="text-[12px] text-yellow-600">Stock level ≤ 10 units</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
