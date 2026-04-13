"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ============================================================
// HELPER: Super Admin auth check
// ============================================================

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: "Unauthorized. Please sign in." };
  }
  const role = (session.user as { role: string }).role;
  if (role !== "SUPER_ADMIN") {
    return { error: "Forbidden. Only SUPER_ADMIN can manage users." };
  }
  return { session };
}

// ============================================================
// ZOD SCHEMAS
// ============================================================

const getUsersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const getUserSchema = z.object({
  id: z.string().min(1),
});

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"]),
  isActive: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"]).optional(),
  isActive: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// ============================================================
// TYPES
// ============================================================

type GetUsersParams = z.infer<typeof getUsersSchema>;
type CreateUserData = z.infer<typeof createUserSchema>;
type UpdateUserData = z.infer<typeof updateUserSchema>;
type ChangePasswordData = z.infer<typeof changePasswordSchema>;

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================================
// 1. GET USERS
// ============================================================

export async function getUsers(
  params?: GetUsersParams
): Promise<
  ActionResult<{
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      image: string | null;
      isActive: boolean;
      createdAt: Date;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>
> {
  const auth = await requireSuperAdmin();
  if ("error" in auth)
    return { success: false, error: auth.error };

  const parsed = getUsersSchema.safeParse(params ?? {});
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { search, role, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    return { success: false, error: message };
  }
}

// ============================================================
// 2. GET USER
// ============================================================

export async function getUser(
  id: string
): Promise<
  ActionResult<{
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  const auth = await requireSuperAdmin();
  if ("error" in auth)
    return { success: false, error: auth.error };

  const parsed = getUserSchema.safeParse({ id });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.data.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: user };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch user";
    return { success: false, error: message };
  }
}

// ============================================================
// 3. CREATE USER
// ============================================================

export async function createUser(
  data: CreateUserData
): Promise<
  ActionResult<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
  }>
> {
  const auth = await requireSuperAdmin();
  if ("error" in auth)
    return { success: false, error: auth.error };

  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { name, email, password, role, isActive } = parsed.data;

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "A user with this email already exists" };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    revalidatePath("/users");

    return { success: true, data: user };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return { success: false, error: message };
  }
}

// ============================================================
// 4. UPDATE USER
// ============================================================

export async function updateUser(
  id: string,
  data: UpdateUserData
): Promise<
  ActionResult<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  const auth = await requireSuperAdmin();
  if ("error" in auth)
    return { success: false, error: auth.error };

  const parsedId = getUserSchema.safeParse({ id });
  if (!parsedId.success) {
    return {
      success: false,
      error: parsedId.error.issues.map((i) => i.message).join(", "),
    };
  }

  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const validated = parsed.data;

  // Verify user exists
  const existing = await prisma.user.findUnique({
    where: { id: parsedId.data.id },
  });
  if (!existing) {
    return { success: false, error: "User not found" };
  }

  // Check for duplicate email if changing
  if (validated.email && validated.email !== existing.email) {
    const duplicate = await prisma.user.findFirst({
      where: { email: validated.email, id: { not: id } },
    });
    if (duplicate) {
      return { success: false, error: "A user with this email already exists" };
    }
  }

  // Build update data
  const updateData: Prisma.UserUpdateInput = {};
  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.email !== undefined) updateData.email = validated.email;
  if (validated.role !== undefined) updateData.role = validated.role;
  if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

  // Only hash and update password if provided
  if (validated.password) {
    updateData.password = await bcrypt.hash(validated.password, 12);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/users");
    revalidatePath(`/users/${id}`);

    return { success: true, data: user };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return { success: false, error: message };
  }
}

// ============================================================
// 5. DELETE USER (soft delete - set isActive=false)
// ============================================================

export async function deleteUser(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireSuperAdmin();
  if ("error" in auth)
    return { success: false, error: auth.error };

  const parsed = getUserSchema.safeParse({ id });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  // Verify user exists
  const existing = await prisma.user.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing) {
    return { success: false, error: "User not found" };
  }

  // Prevent self-deactivation
  if (existing.id === auth.session.user.id) {
    return { success: false, error: "You cannot deactivate your own account" };
  }

  try {
    await prisma.user.update({
      where: { id: parsed.data.id },
      data: { isActive: false },
    });

    revalidatePath("/users");

    return { success: true, data: { id: parsed.data.id } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    return { success: false, error: message };
  }
}

// ============================================================
// 6. CHANGE PASSWORD
// ============================================================

export async function changePassword(
  id: string,
  data: ChangePasswordData
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireSuperAdmin();
  if ("error" in auth)
    return { success: false, error: auth.error };

  const parsedId = getUserSchema.safeParse({ id });
  if (!parsedId.success) {
    return {
      success: false,
      error: parsedId.error.issues.map((i) => i.message).join(", "),
    };
  }

  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  // Verify user exists and check current password
  const existing = await prisma.user.findUnique({
    where: { id: parsedId.data.id },
  });
  if (!existing) {
    return { success: false, error: "User not found" };
  }

  if (!existing.password) {
    return { success: false, error: "Current password is incorrect" };
  }

  const isValid = await bcrypt.compare(currentPassword, existing.password);
  if (!isValid) {
    return { success: false, error: "Current password is incorrect" };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: parsedId.data.id },
      data: { password: hashedPassword },
    });

    return { success: true, data: { id: parsedId.data.id } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to change password";
    return { success: false, error: message };
  }
}
