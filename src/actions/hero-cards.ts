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

const heroCardSchema = z.object({
  slot: z.coerce.number().int().min(1).max(4),
  title: z.string().min(1).max(120),
  subtitle: z.string().max(200).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  linkUrl: z.string().default("/shop"),
  bgColor: z.string().default("#1a1a1a"),
  isActive: z.boolean().default(true),
});

export async function getHeroCards() {
  try {
    const cards = await prisma.heroCard.findMany({
      where: { isActive: true },
      orderBy: { slot: "asc" },
    });
    return { success: true as const, data: cards };
  } catch {
    return { success: false as const, error: "Failed to fetch hero cards" };
  }
}

export async function getAllHeroCards() {
  const auth = await requireAdmin();
  if (!auth.success) return { success: false as const, error: auth.error };
  try {
    const cards = await prisma.heroCard.findMany({ orderBy: { slot: "asc" } });
    return { success: true as const, data: cards };
  } catch {
    return { success: false as const, error: "Failed to fetch hero cards" };
  }
}

export async function upsertHeroCard(data: unknown) {
  const auth = await requireAdmin();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = heroCardSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const card = await prisma.heroCard.upsert({
      where: { slot: parsed.data.slot },
      create: parsed.data,
      update: parsed.data,
    });
    revalidatePath("/");
    return { success: true as const, data: card };
  } catch {
    return { success: false as const, error: "Failed to save hero card" };
  }
}
