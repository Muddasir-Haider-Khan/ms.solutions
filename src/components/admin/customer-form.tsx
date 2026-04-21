"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { createCustomer, updateCustomer } from "@/actions/customers";

// ============================================================
// Types
// ============================================================

type CustomerData = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  taxId: string | null;
  notes: string | null;
  isActive: boolean;
};

interface CustomerFormProps {
  customer?: CustomerData | null;
}

// ============================================================
// Component
// ============================================================

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const isEditing = !!customer;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: customer?.name ?? "",
    companyName: customer?.companyName ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    billingAddress: customer?.billingAddress ?? "",
    shippingAddress: customer?.shippingAddress ?? "",
    taxId: customer?.taxId ?? "",
    notes: customer?.notes ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        companyName: formData.companyName.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        billingAddress: formData.billingAddress.trim() || null,
        shippingAddress: formData.shippingAddress.trim() || null,
        taxId: formData.taxId.trim() || null,
        notes: formData.notes.trim() || null,
        isActive: true,
      };

      if (isEditing && customer) {
        const result = await updateCustomer(customer.id, payload);
        if (result.success) {
          toast.success("Customer updated successfully");
          router.push("/customers");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update customer");
        }
      } else {
        const result = await createCustomer(payload);
        if (result.success) {
          toast.success("Customer created successfully");
          router.push("/customers");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to create customer");
        }
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
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          render={<Link href="/customers" />}
          nativeButton={false}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Customer" : "New Customer"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            render={<Link href="/customers" />}
            nativeButton={false}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isEditing ? "Update Customer" : "Create Customer"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Customer name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                placeholder="Company name (optional)"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / NTN</Label>
              <Input
                id="taxId"
                name="taxId"
                placeholder="Tax identification number"
                value={formData.taxId}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Address & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Textarea
                id="billingAddress"
                name="billingAddress"
                placeholder="Billing address"
                rows={3}
                value={formData.billingAddress}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Shipping Address</Label>
              <Textarea
                id="shippingAddress"
                name="shippingAddress"
                placeholder="Shipping address"
                rows={3}
                value={formData.shippingAddress}
                onChange={handleChange}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Internal notes about this customer"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
