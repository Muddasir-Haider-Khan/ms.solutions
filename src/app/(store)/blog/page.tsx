import Link from "next/link";
import { getPublishedArticles } from "@/actions/articles";
import { ArrowRight, Calendar } from "lucide-react";

export const metadata = { title: "Blog — Multi Solutions Store" };

export default async function ArticlesPage() {
  const result = await getPublishedArticles();
  const articles = result.success && result.data ? result.data : [];

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-[32px] font-bold text-[#222]">From Our Articles</h1>
          <p className="mt-2 text-[15px] text-gray-500">Tips, news and insights from our experts</p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center text-gray-400 py-20">No articles published yet.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((article) => {
              const date = article.publishedAt ? new Date(article.publishedAt) : new Date(article.createdAt);
              return (
                <Link key={article.id} href={`/blog/${article.slug}`} className="group">
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      {article.coverImage ? (
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#00796b]/10 to-[#00796b]/30">
                          <span className="text-4xl font-bold text-[#00796b]/30">{article.title.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex flex-col items-center justify-center rounded-full bg-white shadow size-12 text-center">
                        <span className="text-[14px] font-bold leading-none text-[#222]">{date.getDate().toString().padStart(2, "0")}</span>
                        <span className="text-[9px] font-semibold uppercase text-[#00796b]">
                          {date.toLocaleString("default", { month: "short" })}
                        </span>
                      </div>
                      {article.category && (
                        <div className="absolute bottom-3 left-3">
                          <span className="rounded bg-[#00796b] px-2 py-0.5 text-[10px] font-semibold text-white">
                            {article.category}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="text-[14px] font-semibold text-[#222] group-hover:text-[#00796b] leading-snug transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      {article.excerpt && (
                        <p className="mt-1.5 line-clamp-2 text-[12px] text-[#888]">{article.excerpt}</p>
                      )}
                      <div className="mt-3 flex items-center gap-1 text-[12px] font-medium text-[#00796b]">
                        Read more <ArrowRight className="size-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
