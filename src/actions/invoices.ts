"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  StockMovementType,
} from "@prisma/client";

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
  return { userId: session.user.id, role, success: true as const };
}

// ============================================================
// ZOD SCHEMAS
// ============================================================

const getInvoicesSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  customerId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const getInvoiceSchema = z.object({
  id: z.string().min(1),
});

const invoiceItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional().nullable(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discount: z.coerce.number().min(0).default(0),
  productId: z.string().optional().nullable(),
  variantId: z.string().optional().nullable(),
});

const createInvoiceSchema = z.object({
  customerId: z.string().optional().nullable(),
  billToName: z.string().optional().nullable(),
  billToCompany: z.string().optional().nullable(),
  billToEmail: z.string().email("Invalid email").optional().nullable(),
  billToPhone: z.string().optional().nullable(),
  billToAddress: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  affectsStock: z.boolean().default(true),
});

const updateInvoiceSchema = z.object({
  customerId: z.string().optional().nullable(),
  billToName: z.string().optional().nullable(),
  billToCompany: z.string().optional().nullable(),
  billToEmail: z.string().email("Invalid email").optional().nullable(),
  billToPhone: z.string().optional().nullable(),
  billToAddress: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required").optional(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  affectsStock: z.boolean().optional(),
});

const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive("Payment amount must be positive"),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const deleteInvoiceSchema = z.object({
  id: z.string().min(1),
});

// ============================================================
// TYPES
// ============================================================

type GetInvoicesParams = z.infer<typeof getInvoicesSchema>;
type CreateInvoiceData = z.infer<typeof createInvoiceSchema>;
type UpdateInvoiceData = z.infer<typeof updateInvoiceSchema>;
type RecordPaymentData = z.infer<typeof recordPaymentSchema>;

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type InvoiceListItem = Prisma.InvoiceGetPayload<{
  include: {
    customer: { select: { id: true, name: true, companyName: true } };
    _count: { select: { items: true } };
  };
}>;

type InvoiceDetail = Prisma.InvoiceGetPayload<{
  include: {
    customer: true;
    items: {
      include: {
        product: { select: { id: true, name: true, sku: true } };
        productVariant: { select: { id: true, name: true, sku: true } };
      };
    };
    payments: {
      include: {
        recordedBy: { select: { id: true, name: true, email: true } };
      };
      orderBy: { createdAt: "desc" };
    };
    createdBy: { select: { id: true, name: true, email: true } };
  };
}>;

type InvoiceListResult = {
  invoices: InvoiceListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// ============================================================
// HELPER: Calculate invoice totals from items
// ============================================================

function calculateTotals(
  items: { quantity: number; unitPrice: number; taxRate: number; discount: number }[]
) {
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;
  let totalAmount = 0;

  const calculatedItems = items.map((item, index) => {
    const lineBase = item.quantity * item.unitPrice;
    const lineDiscount = item.discount;
    const afterDiscount = lineBase - lineDiscount;
    const lineTax = afterDiscount * (item.taxRate / 100);
    const lineTotal = afterDiscount + lineTax;

    subtotal += lineBase;
    totalDiscount += lineDiscount;
    totalTax += lineTax;
    totalAmount += lineTotal;

    return {
      lineTotal,
      sortOrder: index,
    };
  });

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(totalTax * 100) / 100,
    discountAmount: Math.round(totalDiscount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    calculatedItems,
  };
}

// ============================================================
// ACTIONS
// ============================================================

/**
 * List invoices with search, status filter, date range, pagination.
 * Includes customer name, item count, and payment status.
 */
export async function getInvoices(
  params?: GetInvoicesParams
): Promise<ActionResult<InvoiceListResult>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = getInvoicesSchema.safeParse(params ?? {});
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { search, status, paymentStatus, dateFrom, dateTo, customerId, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.InvoiceWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (dateFrom || dateTo) {
    where.issueDate = {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    };
  }

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { billToName: { contains: search, mode: "insensitive" } },
      { billToCompany: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { customer: { companyName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, companyName: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    success: true,
    data: {
      invoices,
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
 * Get a full invoice with items (include product info), payments (include user),
 * and customer.
 */
export async function getInvoice(
  id: string
): Promise<ActionResult<InvoiceDetail>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = getInvoiceSchema.safeParse({ id });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: parsed.data.id },
    include: {
      customer: true,
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
          productVariant: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      payments: {
        include: {
          recordedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!invoice) {
    return { success: false, error: "Invoice not found" };
  }

  return { success: true, data: invoice };
}

/**
 * Get the next invoice number. Queries the last invoice by invoiceNumber,
 * parses the numeric part, and increments. Format: {prefix}-{0001}.
 * Gets prefix from CompanySetting (first record). Falls back to "MSC-INV".
 */
export async function getNextInvoiceNumber(): Promise<
  ActionResult<{ invoiceNumber: string }>
> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  // Get prefix from CompanySetting
  const setting = await prisma.companySetting.findFirst();
  const prefix = setting?.invoicePrefix ?? "MSC-INV";

  // Find the last invoice with this prefix to get the highest number
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: { startsWith: `${prefix}-` },
    },
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });

  let nextNumber = 1;

  if (lastInvoice) {
    // Parse the number part after the prefix
    const numberPart = lastInvoice.invoiceNumber.replace(`${prefix}-`, "");
    const parsed = parseInt(numberPart, 10);
    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  const invoiceNumber = `${prefix}-${nextNumber.toString().padStart(4, "0")}`;

  return { success: true, data: { invoiceNumber } };
}

/**
 * Create a draft invoice. Auto-calculates subtotal, taxAmount, discountAmount,
 * and totalAmount from items.
 */
export async function createInvoice(
  data: CreateInvoiceData
): Promise<ActionResult<InvoiceDetail>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = createInvoiceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const validated = parsed.data;

  // Verify customer exists if provided
  if (validated.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });
    if (!customer) {
      return { success: false, error: "Customer not found" };
    }
  }

  // Get next invoice number
  const numberResult = await getNextInvoiceNumber();
  if (!numberResult.success || !numberResult.data) {
    return { success: false, error: numberResult.error ?? "Failed to generate invoice number" };
  }

  // Calculate totals
  const totals = calculateTotals(validated.items);

  try {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: numberResult.data.invoiceNumber,
        status: InvoiceStatus.DRAFT,
        paymentStatus: PaymentStatus.UNPAID,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        customerId: validated.customerId ?? null,
        billToName: validated.billToName ?? null,
        billToCompany: validated.billToCompany ?? null,
        billToEmail: validated.billToEmail ?? null,
        billToPhone: validated.billToPhone ?? null,
        billToAddress: validated.billToAddress ?? null,
        notes: validated.notes ?? null,
        terms: validated.terms ?? null,
        dueDate: validated.dueDate ?? null,
        affectsStock: validated.affectsStock,
        createdById: auth.userId,
        items: {
          create: validated.items.map((item, index) => ({
            name: item.name,
            description: item.description ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            discount: item.discount,
            lineTotal: totals.calculatedItems[index].lineTotal,
            sortOrder: index,
            productId: item.productId ?? null,
            variantId: item.variantId ?? null,
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            productVariant: { select: { id: true, name: true, sku: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
        payments: {
          include: {
            recordedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/dashboard/invoices");

    return { success: true, data: invoice };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create invoice";
    return { success: false, error: message };
  }
}

/**
 * Finalize invoice: change status from DRAFT to SENT.
 * If affectsStock is true, deduct stock for each linked product/variant
 * in a transaction with InventoryTransaction entries.
 */
export async function finalizeInvoice(
  id: string
): Promise<ActionResult<InvoiceDetail>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  // Fetch the invoice with items
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, quantityInStock: true } },
          productVariant: { select: { id: true, name: true, sku: true, quantityInStock: true } },
        },
      },
    },
  });

  if (!invoice) {
    return { success: false, error: "Invoice not found" };
  }

  if (invoice.status !== InvoiceStatus.DRAFT) {
    return { success: false, error: "Only DRAFT invoices can be finalized" };
  }

  if (invoice.stockDeducted) {
    return { success: false, error: "Stock has already been deducted for this invoice" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Deduct stock if affectsStock is true
      if (invoice.affectsStock) {
        for (const item of invoice.items) {
          // Only deduct stock for items linked to a product
          if (!item.productId) continue;

          const deductQuantity = Math.round(item.quantity);

          if (item.variantId) {
            // Deduct from variant
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { quantityInStock: true, productId: true },
            });

            if (!variant) {
              throw new Error(`Variant not found for item: ${item.name}`);
            }

            if (variant.quantityInStock < deductQuantity) {
              throw new Error(
                `Insufficient stock for variant "${item.name}". Available: ${variant.quantityInStock}, Required: ${deductQuantity}`
              );
            }

            const beforeQuantity = variant.quantityInStock;
            const afterQuantity = beforeQuantity - deductQuantity;

            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { quantityInStock: afterQuantity },
            });

            // Also update parent product aggregate stock
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { quantityInStock: true },
            });

            if (product) {
              await tx.product.update({
                where: { id: item.productId },
                data: { quantityInStock: product.quantityInStock - deductQuantity },
              });
            }

            // Create inventory transaction
            await tx.inventoryTransaction.create({
              data: {
                movementType: StockMovementType.INVOICE_SOLD,
                quantity: -deductQuantity,
                beforeQuantity,
                afterQuantity,
                referenceType: "invoice",
                referenceId: invoice.id,
                notes: `Invoice ${invoice.invoiceNumber} - ${item.name}`,
                productId: item.productId,
                variantId: item.variantId,
                createdById: auth.userId,
              },
            });
          } else {
            // Deduct from product directly (no variant)
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { quantityInStock: true },
            });

            if (!product) {
              throw new Error(`Product not found for item: ${item.name}`);
            }

            if (product.quantityInStock < deductQuantity) {
              throw new Error(
                `Insufficient stock for "${item.name}". Available: ${product.quantityInStock}, Required: ${deductQuantity}`
              );
            }

            const beforeQuantity = product.quantityInStock;
            const afterQuantity = beforeQuantity - deductQuantity;

            await tx.product.update({
              where: { id: item.productId },
              data: { quantityInStock: afterQuantity },
            });

            // Create inventory transaction
            await tx.inventoryTransaction.create({
              data: {
                movementType: StockMovementType.INVOICE_SOLD,
                quantity: -deductQuantity,
                beforeQuantity,
                afterQuantity,
                referenceType: "invoice",
                referenceId: invoice.id,
                notes: `Invoice ${invoice.invoiceNumber} - ${item.name}`,
                productId: item.productId,
                createdById: auth.userId,
              },
            });
          }
        }
      }

      // Update invoice status
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.SENT,
          stockDeducted: invoice.affectsStock,
        },
        include: {
          customer: true,
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              productVariant: { select: { id: true, name: true, sku: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          payments: {
            include: {
              recordedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${id}`);

    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to finalize invoice";
    return { success: false, error: message };
  }
}

/**
 * Cancel invoice: change status to CANCELLED.
 * If stock was deducted (stockDeducted=true), restore stock in a transaction.
 */
export async function cancelInvoice(
  id: string
): Promise<ActionResult<InvoiceDetail>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, quantityInStock: true } },
          productVariant: { select: { id: true, name: true, sku: true, quantityInStock: true } },
        },
      },
    },
  });

  if (!invoice) {
    return { success: false, error: "Invoice not found" };
  }

  if (invoice.status === InvoiceStatus.CANCELLED) {
    return { success: false, error: "Invoice is already cancelled" };
  }

  if (invoice.status === InvoiceStatus.DRAFT) {
    // Draft invoices can be cancelled without stock restoration
    try {
      const updated = await prisma.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.CANCELLED },
        include: {
          customer: true,
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              productVariant: { select: { id: true, name: true, sku: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          payments: {
            include: {
              recordedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      revalidatePath("/dashboard/invoices");
      revalidatePath(`/dashboard/invoices/${id}`);

      return { success: true, data: updated };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel invoice";
      return { success: false, error: message };
    }
  }

  // For SENT (or other non-DRAFT) invoices with stock deducted, restore stock
  if (!invoice.stockDeducted) {
    try {
      const updated = await prisma.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.CANCELLED },
        include: {
          customer: true,
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              productVariant: { select: { id: true, name: true, sku: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          payments: {
            include: {
              recordedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      revalidatePath("/dashboard/invoices");
      revalidatePath(`/dashboard/invoices/${id}`);

      return { success: true, data: updated };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel invoice";
      return { success: false, error: message };
    }
  }

  // Restore stock for items that had stock deducted
  try {
    const result = await prisma.$transaction(async (tx) => {
      for (const item of invoice.items) {
        if (!item.productId) continue;

        const restoreQuantity = Math.round(item.quantity);

        if (item.variantId) {
          // Restore variant stock
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { quantityInStock: true },
          });

          if (!variant) {
            throw new Error(`Variant not found for item: ${item.name}`);
          }

          const beforeQuantity = variant.quantityInStock;
          const afterQuantity = beforeQuantity + restoreQuantity;

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { quantityInStock: afterQuantity },
          });

          // Also restore parent product aggregate stock
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { quantityInStock: true },
          });

          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantityInStock: product.quantityInStock + restoreQuantity },
            });
          }

          // Create inventory transaction for the restoration
          await tx.inventoryTransaction.create({
            data: {
              movementType: StockMovementType.CANCELLED_RESTORED,
              quantity: restoreQuantity,
              beforeQuantity,
              afterQuantity,
              referenceType: "invoice",
              referenceId: invoice.id,
              notes: `Cancelled invoice ${invoice.invoiceNumber} - restoring ${item.name}`,
              productId: item.productId,
              variantId: item.variantId,
              createdById: auth.userId,
            },
          });
        } else {
          // Restore product stock (no variant)
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { quantityInStock: true },
          });

          if (!product) {
            throw new Error(`Product not found for item: ${item.name}`);
          }

          const beforeQuantity = product.quantityInStock;
          const afterQuantity = beforeQuantity + restoreQuantity;

          await tx.product.update({
            where: { id: item.productId },
            data: { quantityInStock: afterQuantity },
          });

          // Create inventory transaction for the restoration
          await tx.inventoryTransaction.create({
            data: {
              movementType: StockMovementType.CANCELLED_RESTORED,
              quantity: restoreQuantity,
              beforeQuantity,
              afterQuantity,
              referenceType: "invoice",
              referenceId: invoice.id,
              notes: `Cancelled invoice ${invoice.invoiceNumber} - restoring ${item.name}`,
              productId: item.productId,
              createdById: auth.userId,
            },
          });
        }
      }

      // Update invoice status and mark stock as no longer deducted
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.CANCELLED,
          stockDeducted: false,
        },
        include: {
          customer: true,
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              productVariant: { select: { id: true, name: true, sku: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          payments: {
            include: {
              recordedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${id}`);

    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel invoice";
    return { success: false, error: message };
  }
}

/**
 * Record a payment against an invoice.
 * Updates invoice amountPaid and paymentStatus.
 * If amountPaid >= totalAmount, sets paymentStatus to PAID.
 */
export async function recordPayment(
  data: RecordPaymentData
): Promise<ActionResult<InvoiceDetail>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = recordPaymentSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const validated = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Fetch the invoice with a lock
      const invoice = await tx.invoice.findUnique({
        where: { id: validated.invoiceId },
        include: {
          payments: true,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new Error("Cannot record payment on a cancelled invoice");
      }

      // Create the payment record
      const payment = await tx.invoicePayment.create({
        data: {
          amount: validated.amount,
          method: validated.method,
          reference: validated.reference ?? null,
          notes: validated.notes ?? null,
          invoiceId: validated.invoiceId,
          recordedById: auth.userId,
        },
      });

      // Calculate new total paid
      const newAmountPaid = invoice.amountPaid + validated.amount;

      // Determine new payment status
      let newPaymentStatus: PaymentStatus;
      if (newAmountPaid >= invoice.totalAmount) {
        newPaymentStatus = PaymentStatus.PAID;
      } else if (newAmountPaid > 0) {
        newPaymentStatus = PaymentStatus.PARTIALLY_PAID;
      } else {
        newPaymentStatus = PaymentStatus.UNPAID;
      }

      // Determine new invoice status
      let newStatus = invoice.status;
      if (newPaymentStatus === PaymentStatus.PAID && invoice.status === InvoiceStatus.SENT) {
        newStatus = InvoiceStatus.PAID;
      }

      // Update the invoice
      const updated = await tx.invoice.update({
        where: { id: validated.invoiceId },
        data: {
          amountPaid: Math.round(newAmountPaid * 100) / 100,
          paymentStatus: newPaymentStatus,
          status: newStatus,
        },
        include: {
          customer: true,
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              productVariant: { select: { id: true, name: true, sku: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          payments: {
            include: {
              recordedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${validated.invoiceId}`);

    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record payment";
    return { success: false, error: message };
  }
}

/**
 * Update an invoice. Only allowed if status is DRAFT.
 */
export async function updateInvoice(
  id: string,
  data: UpdateInvoiceData
): Promise<ActionResult<InvoiceDetail>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsedId = getInvoiceSchema.safeParse({ id });
  if (!parsedId.success) {
    return {
      success: false,
      error: parsedId.error.issues.map((i) => i.message).join(", "),
    };
  }

  const parsed = updateInvoiceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const validated = parsed.data;

  // Verify invoice exists and is DRAFT
  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  if (existing.status !== InvoiceStatus.DRAFT) {
    return { success: false, error: "Only DRAFT invoices can be updated" };
  }

  // Verify customer if changing
  if (validated.customerId !== undefined && validated.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });
    if (!customer) {
      return { success: false, error: "Customer not found" };
    }
  }

  try {
    // Build update data
    const updateData: Prisma.InvoiceUpdateInput = {};

    if (validated.customerId !== undefined) {
      updateData.customer = validated.customerId
        ? { connect: { id: validated.customerId } }
        : { disconnect: true };
    }

    if (validated.billToName !== undefined) updateData.billToName = validated.billToName ?? null;
    if (validated.billToCompany !== undefined) updateData.billToCompany = validated.billToCompany ?? null;
    if (validated.billToEmail !== undefined) updateData.billToEmail = validated.billToEmail ?? null;
    if (validated.billToPhone !== undefined) updateData.billToPhone = validated.billToPhone ?? null;
    if (validated.billToAddress !== undefined) updateData.billToAddress = validated.billToAddress ?? null;
    if (validated.notes !== undefined) updateData.notes = validated.notes ?? null;
    if (validated.terms !== undefined) updateData.terms = validated.terms ?? null;
    if (validated.dueDate !== undefined) updateData.dueDate = validated.dueDate ?? null;
    if (validated.affectsStock !== undefined) updateData.affectsStock = validated.affectsStock;

    // If items are being updated, recalculate and replace
    if (validated.items) {
      const totals = calculateTotals(validated.items);

      updateData.subtotal = totals.subtotal;
      updateData.taxAmount = totals.taxAmount;
      updateData.discountAmount = totals.discountAmount;
      updateData.totalAmount = totals.totalAmount;

      // Delete existing items and recreate
      // We do this by setting the items relation
      updateData.items = {
        deleteMany: {},
        create: validated.items.map((item, index) => ({
          name: item.name,
          description: item.description ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discount: item.discount,
          lineTotal: totals.calculatedItems[index].lineTotal,
          sortOrder: index,
          productId: item.productId ?? null,
          variantId: item.variantId ?? null,
        })),
      };
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            productVariant: { select: { id: true, name: true, sku: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
        payments: {
          include: {
            recordedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${id}`);

    return { success: true, data: invoice };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update invoice";
    return { success: false, error: message };
  }
}

/**
 * Delete an invoice. Only allowed if status is DRAFT.
 */
export async function deleteInvoice(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = deleteInvoiceSchema.safeParse({ id });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const existing = await prisma.invoice.findUnique({
    where: { id: parsed.data.id },
  });

  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  if (existing.status !== InvoiceStatus.DRAFT) {
    return { success: false, error: "Only DRAFT invoices can be deleted" };
  }

  if (existing.stockDeducted) {
    return { success: false, error: "Cannot delete invoice with stock already deducted" };
  }

  try {
    await prisma.invoice.delete({ where: { id: parsed.data.id } });

    revalidatePath("/dashboard/invoices");

    return { success: true, data: { id: parsed.data.id } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete invoice";
    return { success: false, error: message };
  }
}
