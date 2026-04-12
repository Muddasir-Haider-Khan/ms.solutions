"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  PackageOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { adjustStock } from "@/actions/inventory";
import type { StockMovementType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductForSelect = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
};

type TransactionItem = {
  id: string;
  movementType: StockMovementType;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: Date;
  productId: string;
  variantId: string | null;
  product: { id: string; name: string; sku: string };
  variant: { id: string; name: string; sku: string } | null;
  createdBy: { id: string; name: string; email: string };
};

type InventoryClientProps = {
  products: ProductForSelect[];
  initialTransactions: TransactionItem[];
  initialPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

// ---------------------------------------------------------------------------
// Movement type helpers
// ---------------------------------------------------------------------------

const MOVEMENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "PURCHASE_ADDED", label: "Purchase Added" },
  { value: "INVOICE_SOLD", label: "Invoice Sold" },
  { value: "ECOMMERCE_SOLD", label: "E-Commerce Sold" },
  { value: "MANUAL_ADJUSTMENT", label: "Manual Adjustment" },
  { value: "RETURN", label: "Return" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "CANCELLED_RESTORED", label: "Cancelled Restored" },
];

function getMovementBadge(movementType: StockMovementType) {
  switch (movementType) {
    case "PURCHASE_ADDED":
      return <Badge variant="default">Purchase Added</Badge>;
    case "INVOICE_SOLD":
      return <Badge variant="secondary">Invoice Sold</Badge>;
    case "ECOMMERCE_SOLD":
      return <Badge variant="secondary">E-Commerce Sold</Badge>;
    case "MANUAL_ADJUSTMENT":
      return <Badge variant="outline">Manual Adjustment</Badge>;
    case "RETURN":
      return <Badge variant="default">Return</Badge>;
    case "DAMAGED":
      return <Badge variant="destructive">Damaged</Badge>;
    case "CANCELLED_RESTORED":
      return <Badge variant="outline">Cancelled Restored</Badge>;
    default:
      return <Badge variant="outline">{movementType}</Badge>;
  }
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InventoryClient({
  products,
  initialTransactions,
  initialPagination,
}: InventoryClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Stock adjustment form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  // Filter state
  const [filterType, setFilterType] = useState("ALL");

  // Transactions state
  const [transactions, setTransactions] =
    useState<TransactionItem[]>(initialTransactions);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // ---------------------------------------------------------------------------
  // Stock adjustment submit
  // ---------------------------------------------------------------------------

  async function handleAdjustStock(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty === 0) {
      toast.error("Quantity must be a non-zero number");
      return;
    }

    startTransition(async () => {
      try {
        const result = await adjustStock({
          productId: selectedProductId,
          quantity: qty,
          notes: notes.trim() || undefined,
        });

        if (result.success) {
          toast.success(
            qty > 0
              ? `Added ${qty} units to stock`
              : `Removed ${Math.abs(qty)} units from stock`
          );
          // Reset form
          setSelectedProductId("");
          setQuantity("");
          setNotes("");
          // Refresh data
          router.refresh();
          loadTransactions(1, filterType);
        } else {
          toast.error(result.error || "Failed to adjust stock");
        }
      } catch {
        toast.error("An unexpected error occurred");
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Load transactions with filter
  // ---------------------------------------------------------------------------

  async function loadTransactions(
    page: number,
    movementType?: string
  ) {
    setIsLoadingTransactions(true);
    try {
      const { getInventoryTransactions } = await import(
        "@/actions/inventory"
      );
      const result = await getInventoryTransactions({
        page,
        pageSize: 20,
        movementType:
          movementType && movementType !== "ALL"
            ? (movementType as StockMovementType)
            : undefined,
      });

      if (result.success) {
        setTransactions(result.data.transactions as TransactionItem[]);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.error || "Failed to load transactions");
      }
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setIsLoadingTransactions(false);
    }
  }

  function handleFilterChange(value: string) {
    setFilterType(value);
    loadTransactions(1, value);
  }

  function handlePageChange(page: number) {
    loadTransactions(page, filterType);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Stock Adjustment Form */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <ArrowUpDown className="mb-1 mr-2 inline size-4" />
              Stock Adjustment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(val) => setSelectedProductId(val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <span className="truncate">{product.name}</span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({product.sku})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {products.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No active products found
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="e.g. 10 or -5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Positive to add stock, negative to remove stock
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Reason for adjustment (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <Button
                type="submit"
                className="w-full"
                disabled={isPending || !selectedProductId || !quantity}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Adjust Stock
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">
              Recent Transactions
            </CardTitle>
            <Select value={filterType} onValueChange={(val) => { if (val) handleFilterChange(val); }}>
              <SelectTrigger size="sm" className="w-44">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <PackageOpen className="mb-4 size-12 text-muted-foreground/50" />
                <h3 className="text-lg font-medium">No transactions found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stock movements will appear here as inventory is adjusted.
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Before</TableHead>
                      <TableHead className="text-right">After</TableHead>
                      <TableHead>By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tx.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {tx.product.sku}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getMovementBadge(tx.movementType)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            tx.quantity > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {tx.beforeQuantity}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {tx.afterQuantity}
                        </TableCell>
                        <TableCell className="text-sm">
                          {tx.createdBy.name}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                          {tx.notes || "--"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages} (
                      {pagination.total} total)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => handlePageChange(pagination.page - 1)}
                      >
                        <ChevronLeft className="size-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => handlePageChange(pagination.page + 1)}
                      >
                        Next
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
