import { getCategories } from "@/actions/categories";
import { CategoryForm } from "@/components/admin/category-form";

export default async function NewCategoryPage() {
  // Fetch all categories for parent select dropdown
  const result = await getCategories();

  const allCategories = result.success && result.data
    ? result.data.categories
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Create Category
        </h1>
        <p className="text-muted-foreground">
          Add a new product category
        </p>
      </div>

      <CategoryForm categories={allCategories} />
    </div>
  );
}
