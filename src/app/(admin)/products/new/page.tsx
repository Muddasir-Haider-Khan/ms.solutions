import { getCategories } from "@/actions/categories";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categoriesResult = await getCategories({ page: 1, perPage: 100, sortBy: "name", sortOrder: "asc" });

  const categories =
    categoriesResult?.success && categoriesResult.data
      ? categoriesResult.data.categories.map((c) => ({
          id: c.id,
          name: c.name,
        }))
      : [];

  return <ProductForm categories={categories} />;
}
