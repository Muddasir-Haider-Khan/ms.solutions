"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ============================================================
// ZOD SCHEMAS
// ============================================================

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Enter a valid phone number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ============================================================
// TYPES
// ============================================================

type SignupData = z.infer<typeof signupSchema>;

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// ============================================================
// CUSTOMER SIGNUP
// ============================================================

/**
 * Register a new customer account.
 * Creates both a User (role: CUSTOMER) and a linked Customer record
 * so the customer appears in the admin panel's Customers section.
 */
export async function signupCustomer(
  data: SignupData
): Promise<ActionResult<{ userId: string; email: string }>> {
  // 1. Validate input
  const parsed = signupSchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    });
    return {
      success: false,
      error: "Please fix the errors below",
      fieldErrors,
    };
  }

  const validated = parsed.data;

  // 2. Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    return {
      success: false,
      error: "An account with this email already exists",
      fieldErrors: { email: "This email is already registered" },
    };
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(validated.password, 12);

  try {
    // 4. Create User + Customer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the User with CUSTOMER role
      const user = await tx.user.create({
        data: {
          name: validated.name,
          email: validated.email,
          password: hashedPassword,
          role: "CUSTOMER",
          isActive: true,
        },
      });

      // Create the linked Customer record (shows up in admin Customers section)
      await tx.customer.create({
        data: {
          name: validated.name,
          email: validated.email,
          phone: validated.phone ?? null,
          userId: user.id,
          isActive: true,
        },
      });

      return { userId: user.id, email: user.email };
    });

    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create account";
    return { success: false, error: message };
  }
}
