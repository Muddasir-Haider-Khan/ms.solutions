"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { OrderStatus, StockMovementType } from "@prisma/client";

// ============================================================
// AUTH HELPER
// ============================================================

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: "Unauthorized. Please sign in." } as const;
  }
  const role = (session.user as { role: string }).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "STAFF") {
    return { error: "Forbidden. Insufficient permissions." } as const;
  }
  return { userId: session.user.id, role } as const;
}

// ============================================================
// ZOD SCHEMAS
// ============================================================

const getOrdersSchema = z.object({
  search: z.string().optional(),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const getOrderDetailSchema = z.object({
  id: z.string().min(1),
});

const updateOrderStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
});

const deleteOrderSchema = z.object({
  id: z.string().min(1),
});

// ============================================================
// 1. GET ORDERS (admin list)
// ============================================================

export async function getOrders(params?: {
  search?: string;
  status?: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const parsed = getOrdersSchema.safeParse(params ?? {});
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { search, status, dateFrom, dateTo, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        shippingCity: true,
        subtotal: true,
        shippingFee: true,
        taxAmount: true,
        totalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    success: true as const,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

// ============================================================
// 2. GET ORDER DETAIL (admin)
// ============================================================

export async function getOrderDetail(id: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const parsed = getOrderDetailSchema.safeParse({ id });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
              sellingPrice: true,
              images: {
                where: { sortOrder: 0 },
                select: { url: true, altText: true },
                take: 1,
              },
            },
          },
          productVariant: {
            select: {
              id: true,
              name: true,
              sku: true,
              sellingPrice: true,
              image: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    return { success: false as const, error: "Order not found" };
  }

  return { success: true as const, data: order };
}

// ============================================================
// 3. UPDATE ORDER STATUS
// ============================================================

export async function updateOrderStatus(id: string, status: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const parsed = updateOrderStatusSchema.safeParse({ id, status });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { id: orderId, status: newStatus } = parsed.data;

  // Fetch the current order
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              quantityInStock: true,
              trackInventory: true,
            },
          },
          productVariant: {
            select: {
              id: true,
              name: true,
              quantityInStock: true,
            },
          },
        },
      },
    },
  });

  if (!existingOrder) {
    return { success: false as const, error: "Order not found" };
  }

  // Prevent setting to the same status
  if (existingOrder.status === newStatus) {
    return {
      success: false as const,
      error: `Order is already ${newStatus}`,
    };
  }

  try {
    // If cancelling, restore stock in a transaction
    if (newStatus === OrderStatus.CANCELLED) {
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Restore stock for each item that was linked to a product
        for (const item of existingOrder.items) {
          if (!item.productId) continue;

          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { quantityInStock: true, trackInventory: true },
          });

          if (!product || !product.trackInventory) continue;

          if (item.variantId) {
            // Restore variant stock
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { quantityInStock: true },
            });

            if (variant) {
              const beforeQuantity = variant.quantityInStock;
              const afterQuantity = beforeQuantity + item.quantity;

              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { quantityInStock: afterQuantity },
              });

              // Also restore parent product aggregate
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  quantityInStock: product.quantityInStock + item.quantity,
                },
              });

              await tx.inventoryTransaction.create({
                data: {
                  movementType: StockMovementType.CANCELLED_RESTORED,
                  quantity: item.quantity,
                  beforeQuantity,
                  afterQuantity,
                  referenceType: "order",
                  referenceId: orderId,
                  notes: `Order ${existingOrder.orderNumber} cancelled - variant stock restored`,
                  productId: item.productId,
                  variantId: item.variantId,
                  createdById: auth.userId,
                },
              });
            }
          } else {
            // Restore product-level stock (no variant)
            const beforeQuantity = product.quantityInStock;
            const afterQuantity = beforeQuantity + item.quantity;

            await tx.product.update({
              where: { id: item.productId },
              data: { quantityInStock: afterQuantity },
            });

            await tx.inventoryTransaction.create({
              data: {
                movementType: StockMovementType.CANCELLED_RESTORED,
                quantity: item.quantity,
                beforeQuantity,
                afterQuantity,
                referenceType: "order",
                referenceId: orderId,
                notes: `Order ${existingOrder.orderNumber} cancelled - stock restored`,
                productId: item.productId,
                createdById: auth.userId,
              },
            });
          }
        }

        // Update order status
        return tx.order.update({
          where: { id: orderId },
          data: { status: newStatus },
          include: {
            items: true,
            customer: {
              select: { id: true, name: true, email: true },
            },
          },
        });
      });

      revalidatePath("/dashboard/orders");
      revalidatePath(`/dashboard/orders/${orderId}`);

      return { success: true as const, data: updatedOrder };
    }

    // For non-cancellation status changes, build timestamp data
    const timestampData: Record<string, unknown> = { status: newStatus };
    if (newStatus === OrderStatus.CONFIRMED) {
      timestampData.confirmedAt = new Date();
    } else if (newStatus === OrderStatus.SHIPPED) {
      timestampData.dispatchedAt = new Date();
    } else if (newStatus === OrderStatus.DELIVERED) {
      timestampData.deliveredAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: timestampData,
      include: {
        items: true,
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);

    return { success: true as const, data: updatedOrder };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update order status";
    return { success: false as const, error: message };
  }
}

// ============================================================
// 4. DELETE ORDER
// ============================================================

export async function deleteOrder(id: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const parsed = deleteOrderSchema.safeParse({ id });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
    },
  });

  if (!order) {
    return { success: false as const, error: "Order not found" };
  }

  // Only allow deletion of PENDING orders
  if (order.status !== OrderStatus.PENDING) {
    return {
      success: false as const,
      error: "Only PENDING orders can be deleted. Cancel the order instead to restore stock.",
    };
  }

  // Check if any stock was already deducted for this order
  const stockDeductions = await prisma.inventoryTransaction.findFirst({
    where: {
      referenceType: "order",
      referenceId: order.id,
      movementType: StockMovementType.ECOMMERCE_SOLD,
    },
  });

  if (stockDeductions) {
    return {
      success: false as const,
      error: "Cannot delete order: stock has already been deducted. Cancel the order instead to restore stock.",
    };
  }

  try {
    // Delete order items first (cascade should handle this, but be explicit)
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({
        where: { orderId: order.id },
      });
      await tx.order.delete({
        where: { id: order.id },
      });
    });

    revalidatePath("/dashboard/orders");

    return { success: true as const, data: { deleted: true, orderNumber: order.orderNumber } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete order";
    return { success: false as const, error: message };
  }
}
