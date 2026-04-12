"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategory, updateCategory } from "@/actions/categories";

async function uploadImage(file: File, category: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Upload failed");
  return data.data.url;
}

type CategoryForSelect = {
  id: string;
  name: string;
  parentId: string | null;
  slug: string;
  isActive: boolean;
};

type CategoryDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  isActive: boolean;
};

type CategoryFormProps = {
  category?: CategoryDetail;
  categories: CategoryForSelect[];
};

export function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [image, setImage] = useState<string>(category?.image ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [parentId, setParentId] = useState<string>(
    category?.parentId ?? "__none__"
  );
  const [isActive, setIsActive] = useState(category?.isActive ?? true);

  // Auto-generate slug from name
  function handleNameChange(value: string) {
    setName(value);
    // Only auto-generate slug if creating new or slug hasn't been manually edited
    if (!category) {
      const generated = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-+/g, "-")
        .substring(0, 100);
      setSlug(generated);
    }
  }

  // Filter out current category from parent options to prevent self-parenting
  const parentOptions = categories.filter((c) => c.id !== category?.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    startTransition(async () => {
      try {
        // Upload image if a new file was selected
        let imageUrl = image;
        if (imageFile) {
          try {
            const uploaded = await uploadImage(imageFile, "categories");
            imageUrl = uploaded;
          } catch {
            toast.error("Failed to upload image");
            return;
          }
        }

        const resolvedParentId =
          parentId === "__none__" ? null : parentId || null;

        if (category) {
          // Update existing category
          const result = await updateCategory(category.id, {
            name: name.trim(),
            description: description.trim() || null,
            image: imageUrl || null,
            parentId: resolvedParentId,
            isActive,
          });

          if (result.success) {
            toast.success("Category updated successfully");
            router.push("/categories");
            router.refresh();
          } else {
            toast.error(result.error || "Failed to update category");
          }
        } else {
          // Create new category
          const result = await createCategory({
            name: name.trim(),
            description: description.trim() || undefined,
            image: imageUrl || undefined,
            parentId: resolvedParentId,
            isActive,
          });

          if (result.success) {
            toast.success("Category created successfully");
            router.push("/categories");
            router.refresh();
          } else {
            toast.error(result.error || "Failed to create category");
          }
        }
      } catch {
        toast.error("An unexpected error occurred");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main fields */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter category name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="category-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={!!category}
                />
                {category ? (
                  <p className="text-xs text-muted-foreground">
                    Slug is auto-generated from the name when it changes
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from the name. A unique slug will be created.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter category description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar fields */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parent Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={parentId} onValueChange={(val) => setParentId(val ?? "__none__")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (Top Level)</SelectItem>
                  {parentOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {image ? (
                <div className="relative">
                  <img
                    src={image}
                    alt="Category image"
                    className="h-32 w-full rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    className="absolute right-1 top-1"
                    onClick={() => {
                      setImage("");
                      setImageFile(null);
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-muted-foreground/50">
                  <Upload className="mb-2 size-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        // Show preview
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label>{isActive ? "Active" : "Inactive"}</Label>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/categories")}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {category ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
