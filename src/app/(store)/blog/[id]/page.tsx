import { getArticle } from "@/actions/articles";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getArticle(id);
  if (!result.success || !result.data) return { title: "Article not found" };
  return {
    title: `${result.data.title} — Multi Solutions`,
    description: result.data.excerpt ?? undefined,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getArticle(id);
  if (!result.success || !result.data || !result.data.isPublished) notFound();
  const article = result.data;
  const date = article.publishedAt ? new Date(article.publishedAt) : new Date(article.createdAt);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      {article.coverImage && (
        <div className="relative h-[320px] md:h-[440px] overflow-hidden bg-gray-900">
          <img src={article.coverImage} alt={article.title} className="size-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/blog"
          className="mb-8 flex items-center gap-1.5 text-[13px] font-medium text-[#00796b] hover:underline"
        >
          <ArrowLeft className="size-4" /> Back to Blog
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            {date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </span>
          {article.category && (
            <span className="flex items-center gap-1 rounded-full bg-[#e0f2f1] px-3 py-0.5 text-[#00796b] font-semibold">
              <Tag className="size-3" /> {article.category}
            </span>
          )}
        </div>

        <h1 className="mt-4 text-[28px] font-bold leading-snug text-[#111] md:text-[36px]">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="mt-4 text-[16px] leading-relaxed text-gray-500 border-l-4 border-[#00796b] pl-4">
            {article.excerpt}
          </p>
        )}

        <div
          className="prose prose-sm md:prose-base mt-8 max-w-none text-[#333] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br/>") }}
        />
      </div>
    </div>
  );
}
