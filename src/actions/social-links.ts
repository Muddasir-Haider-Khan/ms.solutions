"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import {
  DEFAULT_PLATFORMS,
  type SocialPlatform,
} from "@/lib/social-link-constants";

// Public: get all active social links ordered by `order`
export async function getSocialLinks() {
  try {
    const links = await prisma.socialLink.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return { success: true as const, data: links };
  } catch {
    return { success: false as const, data: [] };
  }
}

// Admin: get all social links (active or not)
export async function getAllSocialLinks() {
  await requireAdmin();
  const links = await prisma.socialLink.findMany({
    orderBy: { order: "asc" },
  });
  // Ensure all 4 platforms are represented (fill missing with empty)
  const existing = new Map(links.map((l) => [l.platform, l]));
  return DEFAULT_PLATFORMS.map((platform, index) => {
    const link = existing.get(platform);
    return link ?? {
      id: null,
      platform,
      url: "",
      isActive: false,
      order: index,
    };
  });
}

// Admin: upsert a social link by platform
export async function upsertSocialLink(data: {
  platform: string;
  url: string;
  isActive: boolean;
}) {
  await requireAdmin();

  const existing = await prisma.socialLink.findUnique({
    where: { platform: data.platform },
  });

  const order = DEFAULT_PLATFORMS.indexOf(data.platform as SocialPlatform);

  if (existing) {
    await prisma.socialLink.update({
      where: { platform: data.platform },
      data: {
        url: data.url,
        isActive: data.isActive,
        order: order >= 0 ? order : existing.order,
      },
    });
  } else {
    await prisma.socialLink.create({
      data: {
        platform: data.platform,
        url: data.url,
        isActive: data.isActive,
        order: order >= 0 ? order : 99,
      },
    });
  }

  return { success: true as const };
}
