"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

const getCustomersSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const getCustomerSchema = z.object({
  id: z.string().min(1),
});

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  companyName: z.string().max(255).optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  taxId: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  userId: z.string().optional().nullable(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).optional(),
  companyName: z.string().max(255).optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  taxId: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  userId: z.string().optional().nullable(),
});

const deleteCustomerSchema = z.object({
  id: z.string().min(1),
});

// ============================================================
// TYPES
// ============================================================

type GetCustomersParams = z.infer<typeof getCustomersSchema>;
type CreateCustomerData = z.infer<typeof createCustomerSchema>;
type UpdateCustomerData = z.infer<typeof updateCustomerSchema>;

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type CustomerListItem = Prisma.CustomerGetPayload<{
  include: {
    _count: { select: { invoices: true; orders: true } };
  };
}>;

type CustomerDetail = Prisma.CustomerGetPayload<{
  include: {
    invoices: {
      orderBy: { createdAt: "desc" };
      select: {
        id: true;
        invoiceNumber: true;
        status: true;
        paymentStatus: true;
        totalAmount: true;
        amountPaid: true;
        issueDate: true;
        dueDate: true;
      };
    };
    orders: {
      orderBy: { createdAt: "desc" };
      select: {
        id: true;
        orderNumber: true;
        status: true;
        paymentStatus: true;
        totalAmount: true;
        createdAt: true;
      };
    };
  };
}>;

type CustomerSelectItem = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
};

type CustomerListResult = {
  customers: CustomerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// ============================================================
// ACTIONS
// ============================================================

/**
 * List customers with search, pagination, invoice count and order count.
 */
export async function getCustomers(
  params?: GetCustomersParams
): Promise<ActionResult<CustomerListResult>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = getCustomersSchema.safeParse(params ?? {});
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { search, isActive, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.CustomerWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { taxId: { contains: search, mode: "insensitive" } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { invoices: true, orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    success: true,
    data: {
      customers,
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
 * Get a single customer with invoices and orders.
 */
export async function getCustomer(
  id: string
): Promise<ActionResult<CustomerDetail>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = getCustomerSchema.safeParse({ id });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const customer = await prisma.customer.findUnique({
    where: { id: parsed.data.id },
    include: {
      invoices: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          amountPaid: true,
          issueDate: true,
          dueDate: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!customer) {
    return { success: false, error: "Customer not found" };
  }

  return { success: true, data: customer };
}

/**
 * Create a new customer.
 */
export async function createCustomer(
  data: CreateCustomerData
): Promise<ActionResult<CustomerDetail>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = createCustomerSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const validated = parsed.data;

  // Check for duplicate email if provided
  if (validated.email) {
    const existing = await prisma.customer.findFirst({
      where: { email: validated.email },
    });
    if (existing) {
      return { success: false, error: "A customer with this email already exists" };
    }
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name: validated.name,
        companyName: validated.companyName ?? null,
        email: validated.email ?? null,
        phone: validated.phone ?? null,
        billingAddress: validated.billingAddress ?? null,
        shippingAddress: validated.shippingAddress ?? null,
        taxId: validated.taxId ?? null,
        notes: validated.notes ?? null,
        isActive: validated.isActive ?? true,
        userId: validated.userId ?? null,
      },
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            amountPaid: true,
            issueDate: true,
            dueDate: true,
          },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/customers");

    return { success: true, data: customer };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create customer";
    return { success: false, error: message };
  }
}

/**
 * Update an existing customer.
 */
export async function updateCustomer(
  id: string,
  data: UpdateCustomerData
): Promise<ActionResult<CustomerDetail>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsedId = getCustomerSchema.safeParse({ id });
  if (!parsedId.success) {
    return {
      success: false,
      error: parsedId.error.issues.map((i) => i.message).join(", "),
    };
  }

  const parsed = updateCustomerSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  // Verify customer exists
  const existing = await prisma.customer.findUnique({
    where: { id: parsedId.data.id },
  });
  if (!existing) {
    return { success: false, error: "Customer not found" };
  }

  const validated = parsed.data;

  // Check for duplicate email if changing
  if (validated.email && validated.email !== existing.email) {
    const duplicate = await prisma.customer.findFirst({
      where: { email: validated.email, id: { not: id } },
    });
    if (duplicate) {
      return { success: false, error: "A customer with this email already exists" };
    }
  }

  // Build the update payload, only including fields that were provided
  const updateData: Prisma.CustomerUpdateInput = {};

  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.companyName !== undefined) updateData.companyName = validated.companyName ?? null;
  if (validated.email !== undefined) updateData.email = validated.email ?? null;
  if (validated.phone !== undefined) updateData.phone = validated.phone ?? null;
  if (validated.billingAddress !== undefined) updateData.billingAddress = validated.billingAddress ?? null;
  if (validated.shippingAddress !== undefined) updateData.shippingAddress = validated.shippingAddress ?? null;
  if (validated.taxId !== undefined) updateData.taxId = validated.taxId ?? null;
  if (validated.notes !== undefined) updateData.notes = validated.notes ?? null;
  if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
  if (validated.userId !== undefined) {
    updateData.user = validated.userId
      ? { connect: { id: validated.userId } }
      : { disconnect: true };
  }

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            amountPaid: true,
            issueDate: true,
            dueDate: true,
          },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${id}`);

    return { success: true, data: customer };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update customer";
    return { success: false, error: message };
  }
}

/**
 * Delete a customer. Only allowed if no invoices or orders are linked.
 */
export async function deleteCustomer(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const parsed = deleteCustomerSchema.safeParse({ id });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const existing = await prisma.customer.findUnique({
    where: { id: parsed.data.id },
    include: {
      _count: { select: { invoices: true, orders: true } },
    },
  });

  if (!existing) {
    return { success: false, error: "Customer not found" };
  }

  if (existing._count.invoices > 0) {
    return {
      success: false,
      error: `Cannot delete customer. It has ${existing._count.invoices} linked invoice(s). Remove or reassign the invoices first.`,
    };
  }

  if (existing._count.orders > 0) {
    return {
      success: false,
      error: `Cannot delete customer. It has ${existing._count.orders} linked order(s). Remove or reassign the orders first.`,
    };
  }

  try {
    await prisma.customer.delete({ where: { id: parsed.data.id } });

    revalidatePath("/dashboard/customers");

    return { success: true, data: { id: parsed.data.id } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete customer";
    return { success: false, error: message };
  }
}

/**
 * Get a lightweight list of active customers for dropdown selects.
 */
export async function getCustomersForSelect(): Promise<
  ActionResult<CustomerSelectItem[]>
> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false as const, error: auth.error };

  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
      phone: true,
    },
    orderBy: { name: "asc" },
  });

  return { success: true, data: customers };
}
