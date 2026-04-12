"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { StockMovementType } from "@prisma/client";

// ============================================================
// HELPER: Admin auth check
// ============================================================

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: "Unauthorized. Please sign in." };
  }
  const role = (session.user as { role: string }).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "STAFF") {
    return { error: "Forbidden. Insufficient permissions." };
  }
  return { session };
}

// ============================================================
// ZOD SCHEMAS
// ============================================================

const getInventoryTransactionsSchema = z.object({
  productId: z.string().cuid().optional(),
  movementType: z.enum([
    "PURCHASE_ADDED",
    "INVOICE_SOLD",
    "ECOMMERCE_SOLD",
    "MANUAL_ADJUSTMENT",
    "RETURN",
    "DAMAGED",
    "CANCELLED_RESTORED",
  ]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const adjustStockSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity: z.number().int().refine((val) => val !== 0, {
    message: "Quantity must be non-zero (positive to add, negative to remove)",
  }),
  notes: z.string().max(500).optional(),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().max(100).optional(),
});

const addPurchaseStockSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity: z.number().int().positive("Quantity must be a positive number"),
  notes: z.string().max(500).optional(),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().max(100).optional(),
});

const recordDamagedStockSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity: z.number().int().positive("Quantity must be a positive number"),
  notes: z.string().max(500).optional(),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().max(100).optional(),
});

// ============================================================
// 1. GET INVENTORY TRANSACTIONS (list stock movement logs)
// ============================================================

export async function getInventoryTransactions(params?: {
  productId?: string;
  movementType?: StockMovementType;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const parsed = getInventoryTransactionsSchema.safeParse(params ?? {});
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false as const, error: message };
  }

  const { productId, movementType, dateFrom, dateTo, page, pageSize } = parsed.data;

  const where: Record<string, unknown> = {};
  if (productId) where.productId = productId;
  if (movementType) where.movementType = movementType;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  return {
    success: true as const,
    data: {
      transactions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  };
}

// ============================================================
// 2. ADJUST STOCK (manual add or remove)
// ============================================================

export async function adjustStock(data: {
  productId: string;
  variantId?: string;
  quantity: number;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const parsed = adjustStockSchema.safeParse(data);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false as const, error: message };
  }

  const { productId, variantId, quantity, notes, referenceType, referenceId } = parsed.data;
  const userId = auth.session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get current stock level
      if (variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { quantityInStock: true, productId: true },
        });
        if (!variant) throw new Error("Variant not found");
        if (variant.productId !== productId) {
          throw new Error("Variant does not belong to the specified product");
        }

        const beforeQuantity = variant.quantityInStock;
        const afterQuantity = beforeQuantity + quantity;

        if (afterQuantity < 0) {
          throw new Error(
            `Insufficient stock. Current: ${beforeQuantity}, attempted change: ${quantity}`
          );
        }

        // Update variant stock
        await tx.productVariant.update({
          where: { id: variantId },
          data: { quantityInStock: afterQuantity },
        });

        // Also update the parent product's aggregate stock
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { quantityInStock: true },
        });
        if (product) {
          await tx.product.update({
            where: { id: productId },
            data: { quantityInStock: product.quantityInStock + quantity },
          });
        }

        // Create the inventory transaction
        const transaction = await tx.inventoryTransaction.create({
          data: {
            movementType: "MANUAL_ADJUSTMENT",
            quantity,
            beforeQuantity,
            afterQuantity,
            referenceType: referenceType ?? "manual",
            referenceId,
            notes: notes ?? "Manual stock adjustment",
            productId,
            variantId,
            createdById: userId,
          },
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
        });

        return transaction;
      } else {
        // Adjusting product-level stock (no variant)
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { quantityInStock: true },
        });
        if (!product) throw new Error("Product not found");

        const beforeQuantity = product.quantityInStock;
        const afterQuantity = beforeQuantity + quantity;

        if (afterQuantity < 0) {
          throw new Error(
            `Insufficient stock. Current: ${beforeQuantity}, attempted change: ${quantity}`
          );
        }

        // Update product stock
        await tx.product.update({
          where: { id: productId },
          data: { quantityInStock: afterQuantity },
        });

        // Create the inventory transaction
        const transaction = await tx.inventoryTransaction.create({
          data: {
            movementType: "MANUAL_ADJUSTMENT",
            quantity,
            beforeQuantity,
            afterQuantity,
            referenceType: referenceType ?? "manual",
            referenceId,
            notes: notes ?? "Manual stock adjustment",
            productId,
            createdById: userId,
          },
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
        });

        return transaction;
      }
    });

    return { success: true as const, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to adjust stock";
    return { success: false as const, error: message };
  }
}

// ============================================================
// 3. ADD PURCHASE STOCK
// ============================================================

export async function addPurchaseStock(data: {
  productId: string;
  variantId?: string;
  quantity: number;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const parsed = addPurchaseStockSchema.safeParse(data);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false as const, error: message };
  }

  const { productId, variantId, quantity, notes, referenceType, referenceId } = parsed.data;
  const userId = auth.session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { quantityInStock: true, productId: true },
        });
        if (!variant) throw new Error("Variant not found");
        if (variant.productId !== productId) {
          throw new Error("Variant does not belong to the specified product");
        }

        const beforeQuantity = variant.quantityInStock;
        const afterQuantity = beforeQuantity + quantity;

        // Update variant stock
        await tx.productVariant.update({
          where: { id: variantId },
          data: { quantityInStock: afterQuantity },
        });

        // Update parent product aggregate stock
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { quantityInStock: true },
        });
        if (product) {
          await tx.product.update({
            where: { id: productId },
            data: { quantityInStock: product.quantityInStock + quantity },
          });
        }

        const transaction = await tx.inventoryTransaction.create({
          data: {
            movementType: "PURCHASE_ADDED",
            quantity,
            beforeQuantity,
            afterQuantity,
            referenceType: referenceType ?? "purchase",
            referenceId,
            notes: notes ?? "Stock added from purchase",
            productId,
            variantId,
            createdById: userId,
          },
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
        });

        return transaction;
      } else {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { quantityInStock: true },
        });
        if (!product) throw new Error("Product not found");

        const beforeQuantity = product.quantityInStock;
        const afterQuantity = beforeQuantity + quantity;

        await tx.product.update({
          where: { id: productId },
          data: { quantityInStock: afterQuantity },
        });

        const transaction = await tx.inventoryTransaction.create({
          data: {
            movementType: "PURCHASE_ADDED",
            quantity,
            beforeQuantity,
            afterQuantity,
            referenceType: referenceType ?? "purchase",
            referenceId,
            notes: notes ?? "Stock added from purchase",
            productId,
            createdById: userId,
          },
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
        });

        return transaction;
      }
    });

    return { success: true as const, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add purchase stock";
    return { success: false as const, error: message };
  }
}

// ============================================================
// 4. RECORD DAMAGED STOCK
// ============================================================

export async function recordDamagedStock(data: {
  productId: string;
  variantId?: string;
  quantity: number;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const parsed = recordDamagedStockSchema.safeParse(data);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false as const, error: message };
  }

  const { productId, variantId, quantity, notes, referenceType, referenceId } = parsed.data;
  const userId = auth.session.user.id;

  // Damaged stock removes quantity, so the signed quantity is negative
  const signedQuantity = -quantity;

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { quantityInStock: true, productId: true },
        });
        if (!variant) throw new Error("Variant not found");
        if (variant.productId !== productId) {
          throw new Error("Variant does not belong to the specified product");
        }

        const beforeQuantity = variant.quantityInStock;
        const afterQuantity = beforeQuantity + signedQuantity;

        if (afterQuantity < 0) {
          throw new Error(
            `Insufficient stock to record as damaged. Current: ${beforeQuantity}, attempted removal: ${quantity}`
          );
        }

        await tx.productVariant.update({
          where: { id: variantId },
          data: { quantityInStock: afterQuantity },
        });

        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { quantityInStock: true },
        });
        if (product) {
          await tx.product.update({
            where: { id: productId },
            data: { quantityInStock: product.quantityInStock + signedQuantity },
          });
        }

        const transaction = await tx.inventoryTransaction.create({
          data: {
            movementType: "DAMAGED",
            quantity: signedQuantity,
            beforeQuantity,
            afterQuantity,
            referenceType: referenceType ?? "damage",
            referenceId,
            notes: notes ?? "Damaged stock recorded",
            productId,
            variantId,
            createdById: userId,
          },
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
        });

        return transaction;
      } else {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { quantityInStock: true },
        });
        if (!product) throw new Error("Product not found");

        const beforeQuantity = product.quantityInStock;
        const afterQuantity = beforeQuantity + signedQuantity;

        if (afterQuantity < 0) {
          throw new Error(
            `Insufficient stock to record as damaged. Current: ${beforeQuantity}, attempted removal: ${quantity}`
          );
        }

        await tx.product.update({
          where: { id: productId },
          data: { quantityInStock: afterQuantity },
        });

        const transaction = await tx.inventoryTransaction.create({
          data: {
            movementType: "DAMAGED",
            quantity: signedQuantity,
            beforeQuantity,
            afterQuantity,
            referenceType: referenceType ?? "damage",
            referenceId,
            notes: notes ?? "Damaged stock recorded",
            productId,
            createdById: userId,
          },
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
        });

        return transaction;
      }
    });

    return { success: true as const, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record damaged stock";
    return { success: false as const, error: message };
  }
}

// ============================================================
// 5. GET LOW STOCK PRODUCTS
// ============================================================

export async function getLowStockProducts() {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  try {
    // Fetch products where quantityInStock <= lowStockThreshold.
    // Prisma does not support cross-column comparison in where, so we use
    // a raw query for correctness, then hydrate with relations via a follow-up.
    const lowStockRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Product"
      WHERE "trackInventory" = true
        AND "quantityInStock" <= "lowStockThreshold"
      ORDER BY "quantityInStock" ASC
    `;

    const lowStockIds = lowStockRows.map((r) => r.id);

    if (lowStockIds.length === 0) {
      return { success: true as const, data: [] };
    }

    const products = await prisma.product.findMany({
      where: { id: { in: lowStockIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        quantityInStock: true,
        lowStockThreshold: true,
        status: true,
        unit: true,
        sellingPrice: true,
        images: {
          where: { sortOrder: 0 },
          select: { url: true, altText: true },
          take: 1,
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            quantityInStock: true,
          },
          where: { isActive: true },
        },
      },
      orderBy: { quantityInStock: "asc" },
    });

    return { success: true as const, data: products };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch low stock products";
    return { success: false as const, error: message };
  }
}

// ============================================================
// 6. GET STOCK SUMMARY
// ============================================================

export async function getStockSummary() {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  try {
    const [
      totalProducts,
      activeProducts,
      outOfStockCount,
      recentMovements,
    ] = await Promise.all([
      // Total products
      prisma.product.count(),

      // Active products
      prisma.product.count({
        where: { status: "ACTIVE" },
      }),

      // Out of stock count
      prisma.product.count({
        where: {
          trackInventory: true,
          quantityInStock: 0,
        },
      }),

      // Recent 10 stock movements
      prisma.inventoryTransaction.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Low stock count (quantity <= threshold AND quantity > 0)
    // Prisma does not support cross-column comparison in where, so use raw query
    const lowStockResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM "Product"
      WHERE "trackInventory" = true
        AND "quantityInStock" > 0
        AND "quantityInStock" <= "lowStockThreshold"
    `;
    const lowStockCount = Number(lowStockResult[0]?.count ?? 0);

    // Calculate total stock value (quantityInStock * costPrice)
    // Prisma aggregate doesn't support computed column products
    const stockValueProducts = await prisma.product.findMany({
      where: { quantityInStock: { gt: 0 } },
      select: { quantityInStock: true, costPrice: true },
    });

    const totalStockValue = stockValueProducts.reduce(
      (sum, p) => sum + p.quantityInStock * p.costPrice,
      0
    );

    // Get total quantity in stock
    const totalQuantityResult = await prisma.product.aggregate({
      _sum: { quantityInStock: true },
    });

    return {
      success: true as const,
      data: {
        totalProducts,
        activeProducts,
        totalStockValue,
        totalQuantityInStock: totalQuantityResult._sum.quantityInStock ?? 0,
        lowStockCount,
        outOfStockCount,
        recentMovements,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch stock summary";
    return { success: false as const, error: message };
  }
}
