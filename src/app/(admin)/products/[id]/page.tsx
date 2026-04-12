import { notFound } from "next/navigation";
import { getProduct } from "@/actions/products";
import { getCategories } from "@/actions/categories";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [productResult, categoriesResult] = await Promise.all([
    getProduct(id),
    getCategories({ page: 1, perPage: 100, sortBy: "name", sortOrder: "asc" }),
  ]);

  if (!productResult?.success || !productResult.data) {
    notFound();
  }

  const categories =
    categoriesResult?.success && categoriesResult.data
      ? categoriesResult.data.categories.map((c) => ({
          id: c.id,
          name: c.name,
        }))
      : [];

  return <ProductForm categories={categories} product={productResult.data} />;
}
