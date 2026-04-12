"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

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

const salesSummarySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const invoiceReportSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const orderReportSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const inventoryMovementReportSchema = z.object({
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

// ============================================================
// 1. GET SALES SUMMARY
// ============================================================

export async function getSalesSummary(params?: {
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const parsed = salesSummarySchema.safeParse(params ?? {});
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false as const, error: message };
  }

  const { dateFrom, dateTo } = parsed.data;

  const dateFilter: Record<string, unknown> = {};
  if (dateFrom || dateTo) {
    dateFilter.createdAt = {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    };
  }

  try {
    const [
      totalRevenueResult,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { in: ["PAID", "SENT"] },
          ...dateFilter,
        },
      }),
      prisma.invoice.count({ where: dateFilter }),
      prisma.invoice.count({
        where: { status: "PAID", ...dateFilter },
      }),
      prisma.invoice.count({
        where: { status: { in: ["DRAFT", "SENT"] }, ...dateFilter },
      }),
    ]);

    const totalRevenue = totalRevenueResult._sum.totalAmount ?? 0;
    const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    return {
      success: true as const,
      data: {
        totalRevenue,
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        averageInvoiceValue,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch sales summary";
    return { success: false as const, error: message };
  }
}

// ============================================================
// 2. GET INVENTORY REPORT
// ============================================================

export async function getInventoryReport() {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  try {
    const [totalProducts, activeProducts, stockValueProducts, outOfStockProducts] =
      await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.product.findMany({
          where: { quantityInStock: { gt: 0 } },
          select: { costPrice: true, quantityInStock: true },
        }),
        prisma.product.findMany({
          where: {
            trackInventory: true,
            quantityInStock: 0,
          },
          select: {
            id: true,
            name: true,
            sku: true,
            quantityInStock: true,
            lowStockThreshold: true,
            sellingPrice: true,
          },
        }),
      ]);

    // Total stock value (costPrice * quantityInStock)
    const totalStockValue = stockValueProducts.reduce(
      (sum, p) => sum + p.costPrice * p.quantityInStock,
      0
    );

    // Low stock products: quantity <= threshold AND quantity > 0
    const lowStockRows = await prisma.$queryRaw<
      Array<{ id: string }>
    >`
      SELECT id FROM "Product"
      WHERE "trackInventory" = true
        AND "quantityInStock" > 0
        AND "quantityInStock" <= "lowStockThreshold"
      ORDER BY "quantityInStock" ASC
    `;

    const lowStockIds = lowStockRows.map((r) => r.id);
    let lowStockProducts: Array<{
      id: string;
      name: string;
      sku: string;
      quantityInStock: number;
      lowStockThreshold: number;
      sellingPrice: number;
    }> = [];

    if (lowStockIds.length > 0) {
      lowStockProducts = await prisma.product.findMany({
        where: { id: { in: lowStockIds } },
        select: {
          id: true,
          name: true,
          sku: true,
          quantityInStock: true,
          lowStockThreshold: true,
          sellingPrice: true,
        },
        orderBy: { quantityInStock: "asc" },
      });
    }

    // Top selling products by invoice item quantity
    const topSellingItems = await prisma.invoiceItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      _count: { id: true },
      where: {
        productId: { not: null },
        invoice: { status: { in: ["PAID", "SENT"] } },
      },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    const topProductIds = topSellingItems
      .map((item) => item.productId)
      .filter((id): id is string => id !== null);

    const topProducts = topProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: {
            id: true,
            name: true,
            sku: true,
            sellingPrice: true,
          },
        })
      : [];

    // Merge quantity data with product info
    const topSellingProducts = topSellingItems.map((item) => {
      const product = topProducts.find((p) => p.id === item.productId);
      return {
        id: item.productId ?? "",
        name: product?.name ?? "Unknown",
        sku: product?.sku ?? "",
        totalQuantitySold: item._sum.quantity ?? 0,
        totalSalesCount: item._count.id,
        sellingPrice: product?.sellingPrice ?? 0,
      };
    });

    return {
      success: true as const,
      data: {
        totalProducts,
        activeProducts,
        totalStockValue,
        lowStockProducts,
        outOfStockProducts,
        topSellingProducts,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch inventory report";
    return { success: false as const, error: message };
  }
}

// ============================================================
// 3. GET INVOICE REPORT
// ============================================================

export async function getInvoiceReport(params?: {
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const parsed = invoiceReportSchema.safeParse(params ?? {});
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false as const, error: message };
  }

  const { dateFrom, dateTo } = parsed.data;

  const dateFilter: Record<string, unknown> = {};
  if (dateFrom || dateTo) {
    dateFilter.createdAt = {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    };
  }

  try {
    const statuses = ["DRAFT", "SENT", "PAID", "CANCELLED"] as const;

    const results = await Promise.all(
      statuses.map(async (status) => {
        const [count, totalAmount] = await Promise.all([
          prisma.invoice.count({
            where: { status, ...dateFilter },
          }),
          prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: { status, ...dateFilter },
          }),
        ]);
        return {
          status,
          count,
          totalAmount: totalAmount._sum.totalAmount ?? 0,
        };
      })
    );

    const grandTotal = results.reduce((sum, r) => sum + r.totalAmount, 0);
    const grandCount = results.reduce((sum, r) => sum + r.count, 0);

    return {
      success: true as const,
      data: {
        byStatus: results,
        grandTotal,
        grandCount,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch invoice report";
    return { success: false as const, error: message };
  }
}

// ============================================================
// 4. GET ORDER REPORT
// ============================================================

export async function getOrderReport(params?: {
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const parsed = orderReportSchema.safeParse(params ?? {});
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false as const, error: message };
  }

  const { dateFrom, dateTo } = parsed.data;

  const dateFilter: Record<string, unknown> = {};
  if (dateFrom || dateTo) {
    dateFilter.createdAt = {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    };
  }

  try {
    const statuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ] as const;

    const results = await Promise.all(
      statuses.map(async (status) => {
        const [count, totalAmount] = await Promise.all([
          prisma.order.count({
            where: { status, ...dateFilter },
          }),
          prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status, ...dateFilter },
          }),
        ]);
        return {
          status,
          count,
          totalAmount: totalAmount._sum.totalAmount ?? 0,
        };
      })
    );

    const grandTotal = results.reduce((sum, r) => sum + r.totalAmount, 0);
    const grandCount = results.reduce((sum, r) => sum + r.count, 0);

    return {
      success: true as const,
      data: {
        byStatus: results,
        grandTotal,
        grandCount,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch order report";
    return { success: false as const, error: message };
  }
}

// ============================================================
// 5. GET INVENTORY MOVEMENT REPORT
// ============================================================

export async function getInventoryMovementReport(params?: {
  productId?: string;
  movementType?:
    | "PURCHASE_ADDED"
    | "INVOICE_SOLD"
    | "ECOMMERCE_SOLD"
    | "MANUAL_ADJUSTMENT"
    | "RETURN"
    | "DAMAGED"
    | "CANCELLED_RESTORED";
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const parsed = inventoryMovementReportSchema.safeParse(params ?? {});
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false as const, error: message };
  }

  const { productId, movementType, dateFrom, dateTo, page, pageSize } =
    parsed.data;

  const where: Record<string, unknown> = {};
  if (productId) where.productId = productId;
  if (movementType) where.movementType = movementType;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    };
  }

  try {
    const [movements, total] = await Promise.all([
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
        movements,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch inventory movement report";
    return { success: false as const, error: message };
  }
}
