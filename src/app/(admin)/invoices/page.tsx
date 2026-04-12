import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvoices } from "@/actions/invoices";
import { InvoiceListClient } from "@/components/admin/invoice-list-client";
import { formatCurrency } from "@/lib/slugs";

export default async function InvoicesPage() {
  const result = await getInvoices({ page: 1, limit: 100 });

  const invoices = result?.success && result.data ? result.data.invoices : [];

  // Calculate stats
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidInvoices = invoices.filter(
    (inv) => inv.paymentStatus === "PAID"
  );
  const paidAmount = paidInvoices.reduce(
    (sum, inv) => sum + inv.amountPaid,
    0
  );
  const unpaidInvoices = invoices.filter(
    (inv) =>
      inv.paymentStatus === "UNPAID" ||
      inv.paymentStatus === "PARTIALLY_PAID"
  );
  const unpaidAmount =
    unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) -
    unpaidInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const overdueInvoices = invoices.filter(
    (inv) => inv.paymentStatus === "OVERDUE"
  );
  const overdueAmount =
    overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) -
    overdueInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Create and manage invoices for your customers
          </p>
        </div>
        <Button render={<Link href="/invoices/new" />}>
          <Plus className="size-4" />
          New Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(paidAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Unpaid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(unpaidAmount)} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(overdueAmount)} remaining
            </p>
          </CardContent>
        </Card>
      </div>

      <InvoiceListClient initialInvoices={invoices} />
    </div>
  );
}
