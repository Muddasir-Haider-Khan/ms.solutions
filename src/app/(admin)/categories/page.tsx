import { getCategories } from "@/actions/categories";
import { CategoryListClient } from "@/components/admin/category-list-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function CategoriesPage() {
  const result = await getCategories();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage your product categories
          </p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{result.error}</p>
        </div>
      </div>
    );
  }

  const { categories, total, page, perPage, totalPages } = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage your product categories
          </p>
        </div>
        <Link href="/categories/new">
          <Button>
            <Plus className="size-4" />
            Create Category
          </Button>
        </Link>
      </div>

      <CategoryListClient
        categories={categories}
        pagination={{ total, page, perPage, totalPages }}
      />
    </div>
  );
}
