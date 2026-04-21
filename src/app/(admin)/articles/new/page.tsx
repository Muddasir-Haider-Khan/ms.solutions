import { ArticleForm } from "@/components/admin/article-form";

export default function NewArticlePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Article</h1>
        <p className="text-sm text-gray-500">Create a new blog post or article.</p>
      </div>
      <ArticleForm />
    </div>
  );
}
