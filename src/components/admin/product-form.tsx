"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type FieldValues, type Resolver } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  X,
  ImageIcon,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

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

import { createProduct, updateProduct } from "@/actions/products";
import { slugify } from "@/lib/slugs";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  barcode: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be non-negative"),
  comparePrice: z.coerce.number().min(0).optional().nullable(),
  quantityInStock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  unit: z.enum([
    "PIECE",
    "BOX",
    "KG",
    "LITER",
    "METER",
    "SET",
    "PACK",
    "ROLL",
  ]).default("PIECE"),
  taxPercentage: z.coerce.number().min(0).max(100).default(0),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("DRAFT"),
  trackInventory: z.boolean().default(true),
  featured: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category = {
  id: string;
  name: string;
};

type ProductData = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  barcode: string | null;
  brand: string | null;
  categoryId: string | null;
  costPrice: number;
  sellingPrice: number;
  comparePrice: number | null;
  quantityInStock: number;
  lowStockThreshold: number;
  unit: string;
  taxPercentage: number;
  status: string;
  trackInventory: boolean;
  featured: boolean;
  images: { id: string; url: string; altText: string | null; sortOrder: number }[];
};

interface ProductFormProps {
  categories: Category[];
  product?: ProductData | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<
    { url: string; file?: File; preview?: string }[]
  >(
    product?.images
      ? product.images
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((img) => ({ url: img.url }))
      : []
  );
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      shortDescription: product?.shortDescription ?? "",
      barcode: product?.barcode ?? "",
      brand: product?.brand ?? "",
      categoryId: product?.categoryId ?? "",
      costPrice: product?.costPrice ?? 0,
      sellingPrice: product?.sellingPrice ?? 0,
      comparePrice: product?.comparePrice ?? null,
      quantityInStock: product?.quantityInStock ?? 0,
      lowStockThreshold: product?.lowStockThreshold ?? 10,
      unit: (product?.unit as ProductFormValues["unit"]) ?? "PIECE",
      taxPercentage: product?.taxPercentage ?? 0,
      status: (product?.status as ProductFormValues["status"]) ?? "DRAFT",
      trackInventory: product?.trackInventory ?? true,
      featured: product?.featured ?? false,
    },
  });

  const nameValue = watch("name");

  // Auto-generate slug preview
  const slugPreview = nameValue ? slugify(nameValue) : "";

  // Image upload handler
  const handleImageUpload = useCallback(
    async (files: FileList) => {
      const newFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (newFiles.length === 0) return;

      setIsUploading(true);

      try {
        const uploaded: { url: string }[] = [];

        for (const file of newFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("category", "product");

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          const data = await res.json();
          uploaded.push({ url: data.url });
        }

        setUploadedImages((prev) => [
          ...prev,
          ...uploaded,
        ]);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Image upload failed"
        );
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Form submission
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        categoryId: data.categoryId || null,
        description: data.description || null,
        shortDescription: data.shortDescription || null,
        barcode: data.barcode || null,
        brand: data.brand || null,
        comparePrice: data.comparePrice || null,
      };

      if (isEditing && product) {
        const result = await updateProduct({ id: product.id, ...payload });
        if (result.success) {
          toast.success("Product updated successfully");
          router.push("/products");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update product");
        }
      } else {
        const result = await createProduct(payload);
        if (result.success) {
          toast.success("Product created successfully");
          router.push("/products");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to create product");
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          render={<Link href="/products" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Product" : "New Product"}
          </h1>
          {slugPreview && (
            <p className="text-sm text-muted-foreground">
              Slug: {slugPreview}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            render={<Link href="/products" />}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isEditing ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Product Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter product name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="Enter brand name"
                    {...register("brand")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  placeholder="Brief product description (max 500 chars)"
                  {...register("shortDescription")}
                />
                {errors.shortDescription && (
                  <p className="text-xs text-destructive">
                    {errors.shortDescription.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed product description"
                  rows={4}
                  {...register("description")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    placeholder="Enter barcode"
                    {...register("barcode")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Controller
                    control={control}
                    name="categoryId"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(val) => {
                          field.onChange(val === "__none__" ? null : val);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            No category
                          </SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">
                    Cost Price <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("costPrice")}
                  />
                  {errors.costPrice && (
                    <p className="text-xs text-destructive">
                      {errors.costPrice.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">
                    Selling Price <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("sellingPrice")}
                  />
                  {errors.sellingPrice && (
                    <p className="text-xs text-destructive">
                      {errors.sellingPrice.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comparePrice">Compare Price</Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("comparePrice")}
                  />
                  {errors.comparePrice && (
                    <p className="text-xs text-destructive">
                      {errors.comparePrice.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="quantityInStock">Quantity in Stock</Label>
                  <Input
                    id="quantityInStock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    {...register("quantityInStock")}
                  />
                  {errors.quantityInStock && (
                    <p className="text-xs text-destructive">
                      {errors.quantityInStock.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">
                    Low Stock Threshold
                  </Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="10"
                    {...register("lowStockThreshold")}
                  />
                  {errors.lowStockThreshold && (
                    <p className="text-xs text-destructive">
                      {errors.lowStockThreshold.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Controller
                    control={control}
                    name="unit"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => field.onChange(val ?? "")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PIECE">Piece</SelectItem>
                          <SelectItem value="BOX">Box</SelectItem>
                          <SelectItem value="KG">Kilogram (KG)</SelectItem>
                          <SelectItem value="LITER">Liter</SelectItem>
                          <SelectItem value="METER">Meter</SelectItem>
                          <SelectItem value="SET">Set</SelectItem>
                          <SelectItem value="PACK">Pack</SelectItem>
                          <SelectItem value="ROLL">Roll</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name="trackInventory"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label>Track Inventory</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name="featured"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label>Featured Product</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxPercentage">Tax Percentage</Label>
                <Input
                  id="taxPercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0"
                  {...register("taxPercentage")}
                />
                {errors.taxPercentage && (
                  <p className="text-xs text-destructive">
                    {errors.taxPercentage.message}
                  </p>
                )}
              </div>

              {isEditing && product && (
                <div className="space-y-1 rounded-md bg-muted p-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">SKU:</span>{" "}
                    <span className="font-mono">{product.sku}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Slug:</span>{" "}
                    <span className="font-mono text-xs">{product.slug}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-muted-foreground/50"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files.length > 0) {
                    handleImageUpload(e.dataTransfer.files);
                  }
                }}
              >
                <Upload className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop images here
                </p>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleImageUpload(e.target.files);
                        e.target.value = "";
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.multiple = true;
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.files) {
                          handleImageUpload(target.files);
                        }
                      };
                      input.click();
                    }}
                  >
                    {isUploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    {isUploading ? "Uploading..." : "Browse Files"}
                  </Button>
                </label>
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
                    >
                      <img
                        src={img.url}
                        alt={`Product image ${idx + 1}`}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {uploadedImages.length === 0 && (
                <div className="flex items-center justify-center rounded-md border bg-muted/50 p-4">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="mx-auto size-8" />
                    <p className="mt-1 text-xs">No images uploaded</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
