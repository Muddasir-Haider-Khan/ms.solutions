import Link from "next/link";
import { getAllArticles, deleteArticle } from "@/actions/articles";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { requireAdminRole } from "@/lib/permissions";

export default async function ArticlesPage() {
  await requireAdminRole();
  const result = await getAllArticles();
  const articles = result.success && result.data ? result.data : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-sm text-gray-500">Manage blog posts and articles shown on the store.</p>
        </div>
        <Link
          href="/articles/new"
          className="flex items-center gap-2 rounded-lg bg-[#00796b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005f56]"
        >
          <Plus className="size-4" /> New Article
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Published</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {articles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  No articles yet. Create your first one!
                </td>
              </tr>
            )}
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900 line-clamp-1">{a.title}</p>
                  <p className="text-xs text-gray-400">/articles/{a.slug}</p>
                </td>
                <td className="px-6 py-4 text-gray-600">{a.category ?? "—"}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      a.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {a.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/articles/${a.id}`}
                      className="flex size-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteArticle(a.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="flex size-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
