"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  Pencil,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getInvoices } from "@/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/slugs";

// ============================================================
// Types
// ============================================================

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentStatus: string;
  issueDate: Date | string;
  dueDate: Date | string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  customer: {
    id: string;
    name: string;
    companyName: string | null;
  } | null;
  _count: {
    items: number;
  };
};

interface InvoiceListClientProps {
  initialInvoices: Invoice[];
}

// ============================================================
// Component
// ============================================================

export function InvoiceListClient({ initialInvoices }: InvoiceListClientProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch invoices when filters change
  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      const result = await getInvoices({
        search: debouncedSearch || undefined,
        status: (statusFilter as "DRAFT" | "SENT" | "PAID" | "CANCELLED") || undefined,
        paymentStatus: (paymentFilter as "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE") || undefined,
        page: 1,
        limit: 100,
      });
      if (result && result.success && result.data) {
        setInvoices(result.data.invoices);
      } else {
        setInvoices([]);
      }
      setLoading(false);
    }
    fetchInvoices();
  }, [debouncedSearch, statusFilter, paymentFilter]);

  const getStatusBadge = (invoiceStatus: string) => {
    switch (invoiceStatus) {
      case "DRAFT":
        return (
          <Badge variant="secondary" className="bg-gray-500 text-white">
            Draft
          </Badge>
        );
      case "SENT":
        return (
          <Badge variant="default" className="bg-blue-600 text-white">
            Sent
          </Badge>
        );
      case "PAID":
        return (
          <Badge variant="default" className="bg-green-600 text-white">
            Paid
          </Badge>
        );
      case "CANCELLED":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{invoiceStatus}</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "PAID":
        return (
          <Badge variant="default" className="bg-green-600 text-white">
            Paid
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            Partial
          </Badge>
        );
      case "UNPAID":
        return (
          <Badge variant="outline">Unpaid</Badge>
        );
      case "OVERDUE":
        return (
          <Badge variant="destructive">
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice #, customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val === "__all__" || val === null ? "" : val);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={paymentFilter}
            onValueChange={(val) => {
              setPaymentFilter(val === "__all__" || val === null ? "" : val);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Payments</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
              <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px] ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[60px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[60px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="size-8" />
                      <p>No invoices found.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href="/invoices/new" />}
                      >
                        Create your first invoice
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="font-medium hover:underline font-mono text-sm"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {invoice.customer ? (
                        <div>
                          <p className="font-medium">
                            {invoice.customer.name}
                          </p>
                          {invoice.customer.companyName && (
                            <p className="text-xs text-muted-foreground">
                              {invoice.customer.companyName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invoice.issueDate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(invoice.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          render={
                            <Link href={`/invoices/${invoice.id}`} />
                          }
                          title="View"
                        >
                          <Eye className="size-4" />
                        </Button>
                        {invoice.status === "DRAFT" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            render={
                              <Link href={`/invoices/${invoice.id}`} />
                            }
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
