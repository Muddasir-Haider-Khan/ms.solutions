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

const bannerSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  subtitle: z.string().max(200).optional().nullable(),
  description: z.string().max(400).optional().nullable(),
  imageUrl: z.string().url("Must be a valid URL"),
  linkUrl: z.string().default("/shop"),
  bgColor: z.string().default("#1a2035"),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export async function getBanners() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return { success: true as const, data: banners };
  } catch {
    return { success: false as const, error: "Failed to fetch banners" };
  }
}

export async function getAllBanners() {
  const auth = await requireAdmin();
  if (!auth.success) return { success: false as const, error: auth.error };
  try {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
    return { success: true as const, data: banners };
  } catch {
    return { success: false as const, error: "Failed to fetch banners" };
  }
}

export async function createBanner(data: unknown) {
  const auth = await requireAdmin();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = bannerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const banner = await prisma.banner.create({ data: parsed.data });
    revalidatePath("/");
    return { success: true as const, data: banner };
  } catch {
    return { success: false as const, error: "Failed to create banner" };
  }
}

export async function updateBanner(id: string, data: unknown) {
  const auth = await requireAdmin();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = bannerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const banner = await prisma.banner.update({ where: { id }, data: parsed.data });
    revalidatePath("/");
    return { success: true as const, data: banner };
  } catch {
    return { success: false as const, error: "Failed to update banner" };
  }
}

export async function deleteBanner(id: string) {
  const auth = await requireAdmin();
  if (!auth.success) return { success: false as const, error: auth.error };

  try {
    await prisma.banner.delete({ where: { id } });
    revalidatePath("/");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Failed to delete banner" };
  }
}
