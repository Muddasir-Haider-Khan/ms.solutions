"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugs";
import { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: "Unauthorized. Please sign in." };
  }
  const role = (session.user as { role: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return { error: "Forbidden. Admin access required." };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
  parentId: z.string().cuid("Invalid parent ID").optional().or(z.null()),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .or(z.null()),
  image: z
    .string()
    .url("Invalid image URL")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  parentId: z.string().cuid("Invalid parent ID").optional().or(z.null()),
  isActive: z.boolean().optional(),
});

const getCategoriesParamsSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().cuid().optional().or(z.null()),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(["name", "slug", "createdAt", "updatedAt"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ---------------------------------------------------------------------------
// Return type helpers
// ---------------------------------------------------------------------------

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type CategoryListItem = Prisma.CategoryGetPayload<{
  include: {
    parent: { select: { id: true; name: true } };
    _count: { select: { products: true; children: true } };
  };
}>;

type CategoryDetail = Prisma.CategoryGetPayload<{
  include: {
    parent: { select: { id: true; name: true; slug: true } };
    children: {
      select: { id: true; name: true; slug: true; isActive: true };
    };
    _count: { select: { products: true } };
  };
}>;

type CategoryWithParent = Prisma.CategoryGetPayload<{
  include: { parent: { select: { id: true; name: true } } };
}>;

type CategoryListResult = {
  categories: CategoryListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

// ---------------------------------------------------------------------------
// 1. getCategories – list with filters, parent name, product count
// ---------------------------------------------------------------------------

export async function getCategories(
  params?: z.infer<typeof getCategoriesParamsSchema>
): Promise<ActionResult<CategoryListResult>> {
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError.error };

  const parsed = getCategoriesParamsSchema.safeParse(params ?? {});
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { search, isActive, parentId, page, perPage, sortBy, sortOrder } =
    parsed.data;

  const where: Prisma.CategoryWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (parentId !== undefined) {
    if (parentId === null) {
      where.parentId = null;
    } else {
      where.parentId = parentId;
    }
  }

  const [total, categories] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    success: true,
    data: {
      categories,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

// ---------------------------------------------------------------------------
// 2. getCategory – single category with parent and children
// ---------------------------------------------------------------------------

export async function getCategory(
  id: string
): Promise<ActionResult<CategoryDetail>> {
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError.error };

  if (!id || typeof id !== "string") {
    return { success: false, error: "Invalid category ID." };
  }

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: {
        select: { id: true, name: true, slug: true, isActive: true },
      },
      _count: { select: { products: true } },
    },
  });

  if (!category) {
    return { success: false, error: "Category not found." };
  }

  return { success: true, data: category };
}

// ---------------------------------------------------------------------------
// 3. createCategory – create with auto-generated slug
// ---------------------------------------------------------------------------

export async function createCategory(
  data: z.infer<typeof createCategorySchema>
): Promise<ActionResult<CategoryWithParent>> {
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError.error };

  const parsed = createCategorySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { name, description, image, parentId, isActive } = parsed.data;

  // Validate parent exists when provided
  if (parentId) {
    const parentExists = await prisma.category.findUnique({
      where: { id: parentId },
    });
    if (!parentExists) {
      return { success: false, error: "Parent category not found." };
    }
  }

  // Generate a unique slug
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  try {
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image && image !== "" ? image : null,
        parentId: parentId ?? null,
        isActive: isActive ?? true,
      },
      include: {
        parent: { select: { id: true, name: true } },
      },
    });

    return { success: true, data: category };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "A category with this slug already exists.",
      };
    }
    return {
      success: false,
      error: "Failed to create category. Please try again.",
    };
  }
}

// ---------------------------------------------------------------------------
// 4. updateCategory – update with optional slug regeneration
// ---------------------------------------------------------------------------

export async function updateCategory(
  id: string,
  data: z.infer<typeof updateCategorySchema>
): Promise<ActionResult<CategoryWithParent>> {
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError.error };

  if (!id || typeof id !== "string") {
    return { success: false, error: "Invalid category ID." };
  }

  const parsed = updateCategorySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  // Verify category exists
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Category not found." };
  }

  const updateData: Prisma.CategoryUpdateInput = {};

  // If name is changing, regenerate slug
  if (parsed.data.name !== undefined && parsed.data.name !== existing.name) {
    const baseSlug = slugify(parsed.data.name);
    let slug = baseSlug;
    let suffix = 1;

    while (
      await prisma.category.findFirst({
        where: { slug, id: { not: id } },
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    updateData.name = parsed.data.name;
    updateData.slug = slug;
  }

  if (parsed.data.description !== undefined) {
    updateData.description = parsed.data.description ?? null;
  }

  if (parsed.data.image !== undefined) {
    updateData.image =
      parsed.data.image && parsed.data.image !== ""
        ? parsed.data.image
        : null;
  }

  if (parsed.data.isActive !== undefined) {
    updateData.isActive = parsed.data.isActive;
  }

  // Handle parentId – prevent self-parent and circular hierarchy
  if (parsed.data.parentId !== undefined) {
    const newParentId = parsed.data.parentId ?? null;

    if (newParentId === id) {
      return {
        success: false,
        error: "A category cannot be its own parent.",
      };
    }

    if (newParentId) {
      // Verify parent exists
      const parentExists = await prisma.category.findUnique({
        where: { id: newParentId },
      });
      if (!parentExists) {
        return { success: false, error: "Parent category not found." };
      }

      // Check for circular reference – walk up from the proposed parent
      let currentParentId: string | null = newParentId;
      while (currentParentId) {
        if (currentParentId === id) {
          return {
            success: false,
            error:
              "Circular reference detected. A category cannot be a descendant of itself.",
          };
        }
        const ancestor: { parentId: string | null } | null =
          await prisma.category.findUnique({
            where: { id: currentParentId },
            select: { parentId: true },
          });
        currentParentId = ancestor?.parentId ?? null;
      }
    }

    updateData.parent = newParentId
      ? { connect: { id: newParentId } }
      : { disconnect: true };
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: { select: { id: true, name: true } },
      },
    });

    return { success: true, data: category };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "A category with this slug already exists.",
      };
    }
    return {
      success: false,
      error: "Failed to update category. Please try again.",
    };
  }
}

// ---------------------------------------------------------------------------
// 5. deleteCategory – only if no products linked
// ---------------------------------------------------------------------------

export async function deleteCategory(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const authError = await requireAdmin();
  if (authError) return { success: false, error: authError.error };

  if (!id || typeof id !== "string") {
    return { success: false, error: "Invalid category ID." };
  }

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true, children: true } },
    },
  });

  if (!category) {
    return { success: false, error: "Category not found." };
  }

  if (category._count.products > 0) {
    return {
      success: false,
      error: `Cannot delete category. It has ${category._count.products} linked product(s). Remove or reassign the products first.`,
    };
  }

  if (category._count.children > 0) {
    return {
      success: false,
      error: `Cannot delete category. It has ${category._count.children} child categor(ies). Remove or reassign children first.`,
    };
  }

  try {
    await prisma.category.delete({ where: { id } });
    return { success: true, data: { id } };
  } catch {
    return {
      success: false,
      error: "Failed to delete category. Please try again.",
    };
  }
}
