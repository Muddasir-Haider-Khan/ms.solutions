"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { slugify, generateSKU } from "@/lib/slugs";
import { ProductStatus, StockMovementType } from "@prisma/client";

// ============================================================
// AUTH HELPER
// ============================================================

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: "Unauthorized", success: false } as const;
  }
  const role = (session.user as { role: string }).role;
  if (!["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role)) {
    return { error: "Forbidden: insufficient permissions", success: false } as const;
  }
  return { userId: session.user.id, role } as const;
}

// ============================================================
// ZOD SCHEMAS
// ============================================================

const ProductUnitEnum = z.enum([
  "PIECE",
  "BOX",
  "KG",
  "LITER",
  "METER",
  "SET",
  "PACK",
  "ROLL",
]);

const ProductStatusEnum = z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]);

const getProductsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: ProductStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const getProductSchema = z.object({
  id: z.string().min(1),
});

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  barcode: z.string().optional().nullable(),
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be non-negative"),
  comparePrice: z.coerce.number().min(0).optional().nullable(),
  quantityInStock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  unit: ProductUnitEnum.default("PIECE"),
  status: ProductStatusEnum.default("DRAFT"),
  trackInventory: z.boolean().default(true),
  featured: z.boolean().default(false),
  taxPercentage: z.coerce.number().min(0).max(100).default(0),
  brand: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

const updateProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  barcode: z.string().optional().nullable(),
  costPrice: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
  comparePrice: z.coerce.number().min(0).optional().nullable(),
  quantityInStock: z.coerce.number().int().min(0).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  unit: ProductUnitEnum.optional(),
  status: ProductStatusEnum.optional(),
  trackInventory: z.boolean().optional(),
  featured: z.boolean().optional(),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
  brand: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

const deleteProductSchema = z.object({
  id: z.string().min(1),
});

// ============================================================
// TYPES
// ============================================================

type GetProductsParams = z.infer<typeof getProductsSchema>;
type CreateProductData = z.infer<typeof createProductSchema>;
type UpdateProductData = z.infer<typeof updateProductSchema>;

// ============================================================
// ACTIONS
// ============================================================

/**
 * List products with filters, pagination, category name, and image count.
 */
export async function getProducts(params: GetProductsParams) {
  const auth = await requireAuth();
  if ("error" in auth) return auth;

  const parsed = getProductsSchema.safeParse(params);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { search, categoryId, status, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    status: { not: ProductStatus.ARCHIVED },
  };

  if (status) {
    where.status = status;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
        _count: {
          select: { images: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    success: true,
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

/**
 * Get a single product with category, images, and variants.
 */
export async function getProduct(id: string) {
  const auth = await requireAuth();
  if ("error" in auth) return auth;

  const parsed = getProductSchema.safeParse({ id });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.id },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!product) {
    return { success: false, error: "Product not found" };
  }

  return { success: true, data: product };
}

/**
 * Create a product with auto-generated slug and SKU.
 * If initial stock is provided and trackInventory is true, creates
 * an inventory transaction for the initial stock.
 */
export async function createProduct(data: CreateProductData) {
  const auth = await requireAuth();
  if ("error" in auth) return auth;

  const parsed = createProductSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const validated = parsed.data;

  // Generate slug and ensure uniqueness
  const baseSlug = slugify(validated.name);
  let slug = baseSlug;
  let slugSuffix = 1;

  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${slugSuffix}`;
    slugSuffix++;
  }

  // Generate SKU and ensure uniqueness
  let sku = generateSKU("MSC");
  while (await prisma.product.findUnique({ where: { sku } })) {
    sku = generateSKU("MSC");
  }

  const initialStock = validated.quantityInStock ?? 0;

  const product = await prisma.product.create({
    data: {
      name: validated.name,
      slug,
      sku,
      description: validated.description ?? undefined,
      shortDescription: validated.shortDescription ?? undefined,
      barcode: validated.barcode ?? undefined,
      costPrice: validated.costPrice,
      sellingPrice: validated.sellingPrice,
      comparePrice: validated.comparePrice ?? undefined,
      quantityInStock: initialStock,
      lowStockThreshold: validated.lowStockThreshold,
      unit: validated.unit,
      status: validated.status,
      trackInventory: validated.trackInventory,
      featured: validated.featured,
      taxPercentage: validated.taxPercentage,
      brand: validated.brand ?? undefined,
      categoryId: validated.categoryId ?? undefined,
    },
    include: {
      category: true,
      images: true,
      variants: true,
    },
  });

  // Create an inventory transaction for initial stock if tracking inventory
  if (initialStock > 0 && validated.trackInventory) {
    await prisma.inventoryTransaction.create({
      data: {
        movementType: StockMovementType.PURCHASE_ADDED,
        quantity: initialStock,
        beforeQuantity: 0,
        afterQuantity: initialStock,
        referenceType: "purchase",
        notes: "Initial stock on product creation",
        productId: product.id,
        createdById: auth.userId,
      },
    });
  }

  revalidatePath("/dashboard/products");

  return { success: true, data: product };
}

/**
 * Update a product. If name changes, regenerates the slug.
 */
export async function updateProduct(data: UpdateProductData) {
  const auth = await requireAuth();
  if ("error" in auth) return auth;

  const parsed = updateProductSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { id, ...updateFields } = parsed.data;

  // Verify product exists
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Product not found" };
  }

  // Build the update payload
  const updateData: Record<string, unknown> = {};

  if (updateFields.name !== undefined) {
    updateData.name = updateFields.name;

    // Regenerate slug if name changed
    const baseSlug = slugify(updateFields.name);
    let slug = baseSlug;
    let slugSuffix = 1;

    const slugConflict = await prisma.product.findUnique({
      where: { slug },
    });

    // If slug conflicts with another product (not this one), append suffix
    if (slugConflict && slugConflict.id !== id) {
      while (await prisma.product.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${slugSuffix}`;
        slugSuffix++;
      }
    }

    updateData.slug = slug;
  }

  if (updateFields.description !== undefined) {
    updateData.description = updateFields.description;
  }
  if (updateFields.shortDescription !== undefined) {
    updateData.shortDescription = updateFields.shortDescription;
  }
  if (updateFields.barcode !== undefined) {
    updateData.barcode = updateFields.barcode;
  }
  if (updateFields.costPrice !== undefined) {
    updateData.costPrice = updateFields.costPrice;
  }
  if (updateFields.sellingPrice !== undefined) {
    updateData.sellingPrice = updateFields.sellingPrice;
  }
  if (updateFields.comparePrice !== undefined) {
    updateData.comparePrice = updateFields.comparePrice;
  }
  if (updateFields.quantityInStock !== undefined) {
    updateData.quantityInStock = updateFields.quantityInStock;
  }
  if (updateFields.lowStockThreshold !== undefined) {
    updateData.lowStockThreshold = updateFields.lowStockThreshold;
  }
  if (updateFields.unit !== undefined) {
    updateData.unit = updateFields.unit;
  }
  if (updateFields.status !== undefined) {
    updateData.status = updateFields.status;
  }
  if (updateFields.trackInventory !== undefined) {
    updateData.trackInventory = updateFields.trackInventory;
  }
  if (updateFields.featured !== undefined) {
    updateData.featured = updateFields.featured;
  }
  if (updateFields.taxPercentage !== undefined) {
    updateData.taxPercentage = updateFields.taxPercentage;
  }
  if (updateFields.brand !== undefined) {
    updateData.brand = updateFields.brand;
  }
  if (updateFields.categoryId !== undefined) {
    updateData.categoryId = updateFields.categoryId;
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
      variants: true,
    },
  });

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${id}`);

  return { success: true, data: product };
}

/**
 * Soft delete a product by setting status to ARCHIVED.
 */
export async function deleteProduct(id: string) {
  const auth = await requireAuth();
  if ("error" in auth) return auth;

  const parsed = deleteProductSchema.safeParse({ id });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const existing = await prisma.product.findUnique({
    where: { id: parsed.data.id },
  });

  if (!existing) {
    return { success: false, error: "Product not found" };
  }

  if (existing.status === ProductStatus.ARCHIVED) {
    return { success: false, error: "Product is already archived" };
  }

  const product = await prisma.product.update({
    where: { id: parsed.data.id },
    data: { status: ProductStatus.ARCHIVED },
  });

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${id}`);

  return { success: true, data: product };
}

/**
 * Get a simple list of active products for dropdown selects.
 * Returns id, name, sku, and sellingPrice.
 */
export async function getProductsForSelect() {
  const auth = await requireAuth();
  if ("error" in auth) return auth;

  const products = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      sku: true,
      sellingPrice: true,
    },
    orderBy: { name: "asc" },
  });

  return { success: true, data: products };
}
