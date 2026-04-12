import { notFound } from "next/navigation";
import { getCategory, getCategories } from "@/actions/categories";
import { CategoryForm } from "@/components/admin/category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [categoryResult, allCategoriesResult] = await Promise.all([
    getCategory(id),
    getCategories(),
  ]);

  if (!categoryResult.success || !categoryResult.data) {
    if (categoryResult.error === "Category not found.") {
      notFound();
    }
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Category</h1>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{categoryResult.error}</p>
        </div>
      </div>
    );
  }

  const category = categoryResult.data;
  const allCategories =
    allCategoriesResult.success && allCategoriesResult.data
      ? allCategoriesResult.data.categories
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Category
        </h1>
        <p className="text-muted-foreground">
          Update &quot;{category.name}&quot; category
        </p>
      </div>

      <CategoryForm
        category={category}
        categories={allCategories}
      />
    </div>
  );
}
