import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProducts } from "@/actions/products";
import { getCategories } from "@/actions/categories";
import { ProductListClient } from "@/components/admin/product-list-client";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const [categoriesResult] = await Promise.all([
    getCategories({ page: 1, perPage: 100, sortBy: "name", sortOrder: "asc" }),
  ]);

  const categories =
    categoriesResult?.success && categoriesResult.data
      ? categoriesResult.data.categories.map((c) => ({
          id: c.id,
          name: c.name,
        }))
      : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Button render={<Link href="/products/new" />} nativeButton={false}>
          <Plus className="size-4" />
          Add Product
        </Button>
      </div>

      <ProductListClient categories={categories} />
    </div>
  );
}
