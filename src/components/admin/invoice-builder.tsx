"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  FileText,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { createInvoice } from "@/actions/invoices";
import { formatCurrency } from "@/lib/slugs";

// ============================================================
// Types
// ============================================================

type CustomerOption = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
};

type ProductOption = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
};

type LineItem = {
  key: string;
  productId: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
};

interface InvoiceBuilderProps {
  customers: CustomerOption[];
  products: ProductOption[];
}

// ============================================================
// Component
// ============================================================

export function InvoiceBuilder({ customers, products }: InvoiceBuilderProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer / bill-to state
  const [customerId, setCustomerId] = useState("");
  const [billToName, setBillToName] = useState("");
  const [billToCompany, setBillToCompany] = useState("");
  const [billToEmail, setBillToEmail] = useState("");
  const [billToPhone, setBillToPhone] = useState("");
  const [billToAddress, setBillToAddress] = useState("");

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    {
      key: crypto.randomUUID(),
      productId: "",
      name: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      discount: 0,
    },
  ]);

  // Bottom fields
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [affectsStock, setAffectsStock] = useState(true);

  // When customer is selected, fill bill-to fields
  const handleCustomerSelect = useCallback(
    (id: string | null) => {
      const val = id || "__none__";
      setCustomerId(val);
      if (!val || val === "__none__") {
        setBillToName("");
        setBillToCompany("");
        setBillToEmail("");
        setBillToPhone("");
        setBillToAddress("");
        return;
      }
      const customer = customers.find((c) => c.id === val);
      if (customer) {
        setBillToName(customer.name);
        setBillToCompany(customer.companyName || "");
        setBillToEmail(customer.email || "");
        setBillToPhone(customer.phone || "");
      }
    },
    [customers]
  );

  // Line item management
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        productId: "",
        name: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        discount: 0,
      },
    ]);
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const updateItem = (key: string, field: keyof LineItem, value: unknown) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };

        // When product is selected, auto-fill name and price
        if (field === "productId" && typeof value === "string" && value) {
          const product = products.find((p) => p.id === value);
          if (product) {
            updated.name = product.name;
            updated.unitPrice = product.sellingPrice;
          }
        }

        return updated;
      })
    );
  };

  // Calculated totals
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach((item) => {
      const lineBase = item.quantity * item.unitPrice;
      const lineDiscount = lineBase * (item.discount / 100);
      const afterDiscount = lineBase - lineDiscount;
      const lineTax = afterDiscount * (item.taxRate / 100);

      subtotal += lineBase;
      totalDiscount += lineDiscount;
      totalTax += lineTax;
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }, [items]);

  // Submit handler
  const handleSubmit = async (finalize: boolean = false) => {
    // Validate
    const validItems = items.filter((item) => item.name.trim() && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item with a name and quantity");
      return;
    }

    const hasInvalidPrice = validItems.some((item) => item.unitPrice < 0);
    if (hasInvalidPrice) {
      toast.error("Unit prices cannot be negative");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerId: customerId || null,
        billToName: billToName || null,
        billToCompany: billToCompany || null,
        billToEmail: billToEmail || null,
        billToPhone: billToPhone || null,
        billToAddress: billToAddress || null,
        issueDate: new Date().toISOString(),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        terms: terms || null,
        affectsStock,
        items: validItems.map((item) => ({
          productId: item.productId || null,
          name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discount: item.discount,
        })),
      };

      const result = await createInvoice(payload);
      if (result.success && result.data) {
        toast.success(
          finalize
            ? "Invoice created and finalized"
            : "Invoice saved as draft"
        );
        router.push("/invoices");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create invoice");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          render={<Link href="/invoices" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Create Invoice
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            render={<Link href="/invoices" />}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            Save as Draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Finalize
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Customer</Label>
                <Select value={customerId} onValueChange={handleCustomerSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a customer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      No customer (walk-in)
                    </SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.companyName ? ` (${c.companyName})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="billToName">Bill To Name</Label>
                  <Input
                    id="billToName"
                    value={billToName}
                    onChange={(e) => setBillToName(e.target.value)}
                    placeholder="Customer or company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billToCompany">Company</Label>
                  <Input
                    id="billToCompany"
                    value={billToCompany}
                    onChange={(e) => setBillToCompany(e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billToEmail">Email</Label>
                  <Input
                    id="billToEmail"
                    type="email"
                    value={billToEmail}
                    onChange={(e) => setBillToEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billToPhone">Phone</Label>
                  <Input
                    id="billToPhone"
                    value={billToPhone}
                    onChange={(e) => setBillToPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billToAddress">Address</Label>
                <Textarea
                  id="billToAddress"
                  value={billToAddress}
                  onChange={(e) => setBillToAddress(e.target.value)}
                  placeholder="Billing address"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.key}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Item {index + 1}
                    </span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeItem(item.key)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Product</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(val) =>
                          updateItem(item.key, "productId", val ?? "")
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select product or type below" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__custom__">
                            Custom item
                          </SelectItem>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.sku}) - {formatCurrency(p.sellingPrice)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`name-${item.key}`}>
                        Item Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`name-${item.key}`}
                        value={item.name}
                        onChange={(e) =>
                          updateItem(item.key, "name", e.target.value)
                        }
                        placeholder="Item name or description"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`desc-${item.key}`}>Description</Label>
                    <Input
                      id={`desc-${item.key}`}
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.key, "description", e.target.value)
                      }
                      placeholder="Optional description"
                    />
                  </div>

                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor={`qty-${item.key}`}>Qty</Label>
                      <Input
                        id={`qty-${item.key}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.key,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`price-${item.key}`}>Unit Price</Label>
                      <Input
                        id={`price-${item.key}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            item.key,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`tax-${item.key}`}>Tax %</Label>
                      <Input
                        id={`tax-${item.key}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.taxRate}
                        onChange={(e) =>
                          updateItem(
                            item.key,
                            "taxRate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`disc-${item.key}`}>Discount %</Label>
                      <Input
                        id={`disc-${item.key}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) =>
                          updateItem(
                            item.key,
                            "discount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Line total preview */}
                  <div className="flex justify-end text-sm">
                    <span className="text-muted-foreground">Line Total: </span>
                    <span className="ml-1 font-medium">
                      {formatCurrency(
                        (() => {
                          const base = item.quantity * item.unitPrice;
                          const disc = base * (item.discount / 100);
                          const afterDisc = base - disc;
                          const tax = afterDisc * (item.taxRate / 100);
                          return afterDisc + tax;
                        })()
                      )}
                    </span>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addItem}
              >
                <Plus className="size-4" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Notes & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={affectsStock}
                      onChange={(e) => setAffectsStock(e.target.checked)}
                      className="size-4 rounded border-input"
                    />
                    <span className="text-sm font-medium">
                      Affects Stock
                    </span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Invoice notes (shown on invoice)"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Payment terms and conditions"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bill-to preview */}
              {(billToName || billToCompany) && (
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <p className="font-medium">Bill To:</p>
                  {billToName && <p>{billToName}</p>}
                  {billToCompany && (
                    <p className="text-muted-foreground">{billToCompany}</p>
                  )}
                  {billToEmail && (
                    <p className="text-muted-foreground">{billToEmail}</p>
                  )}
                  {billToPhone && (
                    <p className="text-muted-foreground">{billToPhone}</p>
                  )}
                </div>
              )}

              <Separator />

              {/* Items summary */}
              <div className="space-y-2">
                {items
                  .filter((i) => i.name.trim())
                  .map((item, idx) => (
                    <div
                      key={item.key}
                      className="flex justify-between text-sm"
                    >
                      <span className="truncate max-w-[60%]">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  ))}
                {items.filter((i) => i.name.trim()).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No items added yet
                  </p>
                )}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(calculations.subtotal)}</span>
                </div>
                {calculations.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">
                      -{formatCurrency(calculations.totalDiscount)}
                    </span>
                  </div>
                )}
                {calculations.totalTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(calculations.totalTax)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span>{formatCurrency(calculations.grandTotal)}</span>
                </div>
              </div>

              {dueDate && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Due Date</span>
                    <span>{new Date(dueDate).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
