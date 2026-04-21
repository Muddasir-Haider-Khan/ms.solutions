"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Send,
  XCircle,
  Printer,
  FileDown,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { finalizeInvoice, cancelInvoice, recordPayment } from "@/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/slugs";
import { InvoicePreview } from "@/components/admin/invoice-preview";

// ============================================================
// Types
// ============================================================

type InvoiceItem = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  lineTotal: number;
  sortOrder: number;
  productId: string | null;
  product: { id: string; name: string; sku: string } | null;
  productVariant: { id: string; name: string; sku: string } | null;
};

type Payment = {
  id: string;
  amount: number;
  paymentDate: Date | string;
  method: string;
  reference: string | null;
  notes: string | null;
  createdAt: Date | string;
  recordedBy: { id: string; name: string; email: string };
};

type InvoiceData = {
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
  terms: string | null;
  affectsStock: boolean;
  stockDeducted: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  customer: {
    id: string;
    name: string;
    companyName: string | null;
    email: string | null;
    phone: string | null;
    billingAddress: string | null;
    shippingAddress: string | null;
    taxId: string | null;
  } | null;
  billToName: string | null;
  billToCompany: string | null;
  billToEmail: string | null;
  billToPhone: string | null;
  billToAddress: string | null;
  createdBy: { id: string; name: string; email: string };
  items: InvoiceItem[];
  payments: Payment[];
};

interface InvoiceDetailProps {
  invoice: InvoiceData;
}

// ============================================================
// Component
// ============================================================

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const balanceDue = invoice.totalAmount - invoice.amountPaid;

  const getStatusBadge = (invoiceStatus: string) => {
    switch (invoiceStatus) {
      case "DRAFT":
        return (
          <Badge variant="secondary" className="bg-gray-500 text-white text-sm">
            Draft
          </Badge>
        );
      case "SENT":
        return (
          <Badge variant="default" className="bg-blue-600 text-white text-sm">
            Sent
          </Badge>
        );
      case "PAID":
        return (
          <Badge variant="default" className="bg-green-600 text-white text-sm">
            Paid
          </Badge>
        );
      case "CANCELLED":
        return <Badge variant="outline" className="text-sm">Cancelled</Badge>;
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
            Partially Paid
          </Badge>
        );
      case "UNPAID":
        return <Badge variant="outline">Unpaid</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH": return "Cash";
      case "BANK_TRANSFER": return "Bank Transfer";
      case "CARD": return "Card";
      case "CHEQUE": return "Cheque";
      case "OTHER": return "Other";
      default: return method;
    }
  };

  const handleFinalize = () => {
    startTransition(async () => {
      const result = await finalizeInvoice(invoice.id);
      if (result.success) {
        toast.success("Invoice finalized successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to finalize invoice");
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelInvoice(invoice.id);
      if (result.success) {
        toast.success("Invoice cancelled");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to cancel invoice");
      }
    });
  };

  const handleRecordPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    if (amount > balanceDue) {
      toast.error("Payment amount cannot exceed balance due");
      return;
    }

    startTransition(async () => {
      const result = await recordPayment({
        invoiceId: invoice.id,
        amount,
        method: paymentMethod as "CASH" | "BANK_TRANSFER" | "CARD" | "CHEQUE" | "OTHER",
        reference: paymentReference || null,
        notes: paymentNotes || null,
      });
      if (result.success) {
        toast.success("Payment recorded successfully");
        setPaymentDialogOpen(false);
        setPaymentAmount("");
        setPaymentReference("");
        setPaymentNotes("");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to record payment");
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header - hidden in print */}
      <div className="print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            render={<Link href="/invoices" />}
            nativeButton={false}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                {invoice.invoiceNumber}
              </h1>
              {getStatusBadge(invoice.status)}
              {getPaymentStatusBadge(invoice.paymentStatus)}
            </div>
            <p className="text-sm text-muted-foreground">
              Created by {invoice.createdBy.name} on{" "}
              {formatDate(invoice.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {invoice.status === "DRAFT" && (
              <Button onClick={handleFinalize} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Finalize
              </Button>
            )}
            {(invoice.status === "DRAFT" || invoice.status === "SENT") &&
              balanceDue > 0 && (
                <Dialog
                  open={paymentDialogOpen}
                  onOpenChange={setPaymentDialogOpen}
                >
                  <DialogTrigger
                    render={<Button variant="outline" />}
                  >
                    <DollarSign className="size-4" />
                    Record Payment
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Record Payment</DialogTitle>
                      <DialogDescription>
                        Balance due: {formatCurrency(balanceDue)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="payAmount">
                          Amount <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="payAmount"
                          type="number"
                          min="0.01"
                          max={balanceDue}
                          step="0.01"
                          placeholder="0.00"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={(val) => setPaymentMethod(val ?? "CASH")}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">Cash</SelectItem>
                            <SelectItem value="BANK_TRANSFER">
                              Bank Transfer
                            </SelectItem>
                            <SelectItem value="CARD">Card</SelectItem>
                            <SelectItem value="CHEQUE">Cheque</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payRef">Reference</Label>
                        <Input
                          id="payRef"
                          placeholder="Transaction reference"
                          value={paymentReference}
                          onChange={(e) =>
                            setPaymentReference(e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payNotes">Notes</Label>
                        <Textarea
                          id="payNotes"
                          placeholder="Payment notes"
                          rows={2}
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setPaymentDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRecordPayment}
                        disabled={isPending}
                      >
                        {isPending && (
                          <Loader2 className="size-4 animate-spin" />
                        )}
                        Record Payment
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="outline" />}
                >
                  <XCircle className="size-4" />
                  Cancel
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel invoice{" "}
                      {invoice.invoiceNumber}?
                      {invoice.stockDeducted &&
                        " Stock that was deducted will be restored."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={isPending}
                    >
                      {isPending && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Cancel Invoice
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Preview (printable) */}
      <div ref={printRef}>
        <InvoicePreview invoice={invoice} />
      </div>

      {/* Payment History - hidden in print */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No payments recorded yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>
                      {getPaymentMethodLabel(payment.method)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.reference || "-"}
                    </TableCell>
                    <TableCell>{payment.recordedBy.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Separator className="my-4" />

          <div className="flex justify-between text-sm">
            <span>Total Paid</span>
            <span className="font-medium">
              {formatCurrency(invoice.amountPaid)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Balance Due</span>
            <span
              className={`font-medium ${
                balanceDue > 0 ? "text-destructive" : "text-green-600"
              }`}
            >
              {formatCurrency(balanceDue)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
