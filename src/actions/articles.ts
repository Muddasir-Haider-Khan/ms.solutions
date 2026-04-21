"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role ?? "")) {
    return { error: "Unauthorized", success: false as const };
  }
  return { success: true as const };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

const articleSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().url().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  isPublished: z.boolean().default(false),
});

export async function getPublishedArticles(limit?: number) {
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    return { success: true as const, data: articles };
  } catch {
    return { success: false as const, error: "Failed to fetch articles" };
  }
}

export async function getArticle(slug: string) {
  try {
    const article = await prisma.article.findUnique({ where: { slug } });
    if (!article) return { success: false as const, error: "Not found" };
    return { success: true as const, data: article };
  } catch {
    return { success: false as const, error: "Failed to fetch article" };
  }
}

export async function getAllArticles() {
  const auth = await requireAdmin();
  if (!auth.success) return { success: false as const, error: auth.error };
  try {
    const articles = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });
    return { success: true as const, data: articles };
  } catch {
    return { success: false as const, error: "Failed to fetch articles" };
  }
}

export async function getArticleById(id: string) {
  const auth = await requireAdmin();
  if (!auth.success) return { success: false as const, error: auth.error };
  try {
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) return { success: false as const, error: "Not found" };
    return { success: true as const, data: article };
  } catch {
    return { success: false as const, error: "Failed to fetch article" };
  }
}

export async function createArticle(data: unknown) {
  const auth = await requireAdmin();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = articleSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const slug = slugify(parsed.data.title);
  const existingCount = await prisma.article.count({ where: { slug: { startsWith: slug } } });
  const finalSlug = existingCount > 0 ? `${slug}-${existingCount}` : slug;

  try {
    const article = await prisma.article.create({
      data: {
        ...parsed.data,
        slug: finalSlug,
        publishedAt: parsed.data.isPublished ? new Date() : null,
      },
    });
    revalidatePath("/");
    revalidatePath("/articles");
    return { success: true as const, data: article };
  } catch {
    return { success: false as const, error: "Failed to create article" };
  }
}

export async function updateArticle(id: string, data: unknown) {
  const auth = await requireAdmin();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = articleSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const existing = await prisma.article.findUnique({ where: { id } });
    const article = await prisma.article.update({
      where: { id },
      data: {
        ...parsed.data,
        publishedAt:
          parsed.data.isPublished && !existing?.publishedAt ? new Date() : existing?.publishedAt,
      },
    });
    revalidatePath("/");
    revalidatePath("/articles");
    return { success: true as const, data: article };
  } catch {
    return { success: false as const, error: "Failed to update article" };
  }
}

export async function deleteArticle(id: string) {
  const auth = await requireAdmin();
  if (!auth.success) return { success: false as const, error: auth.error };
  try {
    await prisma.article.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/articles");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Failed to delete article" };
  }
}
