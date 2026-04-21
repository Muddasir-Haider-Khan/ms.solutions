import { getArticleById } from "@/actions/articles";
import { ArticleForm } from "@/components/admin/article-form";
import { notFound } from "next/navigation";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getArticleById(id);
  if (!result.success || !result.data) notFound();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
        <p className="text-sm text-gray-500">Update article content.</p>
      </div>
      <ArticleForm initial={result.data} />
    </div>
  );
}
