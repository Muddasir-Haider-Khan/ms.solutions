"use client";

import { useState, useCallback, useRef } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import { updateSettings } from "@/actions/settings";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const settingsFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(255),
  companyLogo: z.string().optional().nullable(),
  letterheadImage: z.string().optional().nullable(),
  footerImage: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  website: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  invoicePrefix: z.string().min(1, "Invoice prefix is required").max(50),
  currency: z.string().min(1, "Currency is required").max(10),
  currencySymbol: z.string().min(1, "Currency symbol is required").max(10),
  defaultTaxPercentage: z.coerce.number().min(0).max(100).default(0),
  defaultInvoiceNotes: z.string().optional().nullable(),
  defaultInvoiceTerms: z.string().optional().nullable(),
  storeName: z.string().min(1, "Store name is required").max(255),
  storeDescription: z.string().optional().nullable(),
  storeLive: z.boolean().default(false),
  invoiceAffectsStock: z.boolean().default(true),
  orderReservesStock: z.boolean().default(true),
  shippingFee: z.coerce.number().min(0).default(0),
  freeShippingThreshold: z.coerce.number().min(0).optional().nullable(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SettingsData = {
  id: string;
  companyName: string;
  companyLogo: string | null;
  letterheadImage: string | null;
  footerImage: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxNumber: string | null;
  invoicePrefix: string;
  currency: string;
  currencySymbol: string;
  defaultTaxPercentage: number;
  defaultInvoiceNotes: string | null;
  defaultInvoiceTerms: string | null;
  storeName: string;
  storeDescription: string | null;
  storeLive: boolean;
  invoiceAffectsStock: boolean;
  orderReservesStock: boolean;
  shippingFee: number;
  freeShippingThreshold: number | null;
  createdAt: Date;
  updatedAt: Date;
};

interface SettingsFormProps {
  settings: SettingsData | null;
}

// ---------------------------------------------------------------------------
// Image Upload Field
// ---------------------------------------------------------------------------

function ImageUploadField({
  label,
  value,
  onChange,
  category,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  category: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Upload failed");
        }

        const data = await res.json();
        onChange(data.data.url);
        toast.success(`${label} uploaded successfully`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Upload failed"
        );
      } finally {
        setIsUploading(false);
      }
    },
    [category, label, onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
      e.target.value = "";
    }
  };

  const handleRemove = () => {
    onChange(null);
    toast.success(`${label} removed`);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value ? (
        <div className="group relative w-full overflow-hidden rounded-md border bg-muted">
          <img
            src={value}
            alt={label}
            className="h-32 w-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-muted-foreground/50 cursor-pointer"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("image/")) {
              handleUpload(file);
            }
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {isUploading ? (
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          ) : (
            <ImageIcon className="size-8 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">
            {isUploading ? "Uploading..." : "Click or drag to upload"}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsForm({ settings }: SettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema) as Resolver<SettingsFormValues>,
    defaultValues: {
      companyName: settings?.companyName ?? "Multi Solutions Company",
      companyLogo: settings?.companyLogo ?? null,
      letterheadImage: settings?.letterheadImage ?? null,
      footerImage: settings?.footerImage ?? null,
      address: settings?.address ?? "",
      phone: settings?.phone ?? "",
      email: settings?.email ?? "",
      website: settings?.website ?? "",
      taxNumber: settings?.taxNumber ?? "",
      invoicePrefix: settings?.invoicePrefix ?? "MSC-INV",
      currency: settings?.currency ?? "PKR",
      currencySymbol: settings?.currencySymbol ?? "Rs",
      defaultTaxPercentage: settings?.defaultTaxPercentage ?? 0,
      defaultInvoiceNotes: settings?.defaultInvoiceNotes ?? "",
      defaultInvoiceTerms: settings?.defaultInvoiceTerms ?? "",
      storeName: settings?.storeName ?? "Multi Solutions Store",
      storeDescription: settings?.storeDescription ?? "",
      storeLive: settings?.storeLive ?? false,
      invoiceAffectsStock: settings?.invoiceAffectsStock ?? true,
      orderReservesStock: settings?.orderReservesStock ?? true,
      shippingFee: settings?.shippingFee ?? 0,
      freeShippingThreshold: settings?.freeShippingThreshold ?? null,
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        taxNumber: data.taxNumber || null,
        companyLogo: data.companyLogo || null,
        letterheadImage: data.letterheadImage || null,
        footerImage: data.footerImage || null,
        defaultInvoiceNotes: data.defaultInvoiceNotes || null,
        defaultInvoiceTerms: data.defaultInvoiceTerms || null,
        storeDescription: data.storeDescription || null,
        freeShippingThreshold: data.freeShippingThreshold || null,
      };

      const result = await updateSettings(payload);
      if (result.success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error(result.error || "Failed to save settings");
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="store">Store</TabsTrigger>
        </TabsList>

        {/* ================================================================
            COMPANY TAB
            ================================================================ */}
        <TabsContent value="company" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Enter company name"
                    {...register("companyName")}
                  />
                  {errors.companyName && (
                    <p className="text-xs text-destructive">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    {...register("phone")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter company address"
                  rows={2}
                  {...register("address")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="company@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    {...register("website")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxNumber">Tax Number (NTN)</Label>
                <Input
                  id="taxNumber"
                  placeholder="Enter tax number"
                  {...register("taxNumber")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Controller
                  control={control}
                  name="companyLogo"
                  render={({ field }) => (
                    <ImageUploadField
                      label="Company Logo"
                      value={field.value}
                      onChange={field.onChange}
                      category="logo"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="letterheadImage"
                  render={({ field }) => (
                    <ImageUploadField
                      label="Letterhead Image"
                      value={field.value}
                      onChange={field.onChange}
                      category="letterhead"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="footerImage"
                  render={({ field }) => (
                    <ImageUploadField
                      label="Footer Image"
                      value={field.value}
                      onChange={field.onChange}
                      category="footer"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================
            INVOICE TAB
            ================================================================ */}
        <TabsContent value="invoice" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">
                    Invoice Prefix <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="invoicePrefix"
                    placeholder="MSC-INV"
                    {...register("invoicePrefix")}
                  />
                  {errors.invoicePrefix && (
                    <p className="text-xs text-destructive">
                      {errors.invoicePrefix.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => field.onChange(val ?? "")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                          <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">
                    Currency Symbol <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="currencySymbol"
                    placeholder="Rs"
                    {...register("currencySymbol")}
                  />
                  {errors.currencySymbol && (
                    <p className="text-xs text-destructive">
                      {errors.currencySymbol.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultTaxPercentage">
                    Default Tax Percentage (%)
                  </Label>
                  <Input
                    id="defaultTaxPercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0"
                    {...register("defaultTaxPercentage")}
                  />
                  {errors.defaultTaxPercentage && (
                    <p className="text-xs text-destructive">
                      {errors.defaultTaxPercentage.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <Controller
                    control={control}
                    name="invoiceAffectsStock"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label>Invoice affects stock</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="defaultInvoiceNotes">
                  Default Invoice Notes
                </Label>
                <Textarea
                  id="defaultInvoiceNotes"
                  placeholder="Default notes to appear on invoices"
                  rows={3}
                  {...register("defaultInvoiceNotes")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultInvoiceTerms">
                  Default Invoice Terms
                </Label>
                <Textarea
                  id="defaultInvoiceTerms"
                  placeholder="Default terms and conditions"
                  rows={3}
                  {...register("defaultInvoiceTerms")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================
            STORE TAB
            ================================================================ */}
        <TabsContent value="store" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">
                    Store Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="storeName"
                    placeholder="Enter store name"
                    {...register("storeName")}
                  />
                  {errors.storeName && (
                    <p className="text-xs text-destructive">
                      {errors.storeName.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <Controller
                    control={control}
                    name="storeLive"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label>Store is live</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeDescription">Store Description</Label>
                <Textarea
                  id="storeDescription"
                  placeholder="Describe your store"
                  rows={3}
                  {...register("storeDescription")}
                />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shippingFee">Shipping Fee</Label>
                  <Input
                    id="shippingFee"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("shippingFee")}
                  />
                  {errors.shippingFee && (
                    <p className="text-xs text-destructive">
                      {errors.shippingFee.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="freeShippingThreshold">
                    Free Shipping Threshold
                  </Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Leave empty for no free shipping"
                    {...register("freeShippingThreshold")}
                  />
                  {errors.freeShippingThreshold && (
                    <p className="text-xs text-destructive">
                      {errors.freeShippingThreshold.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="orderReservesStock"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label>Order reserves stock</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
}
