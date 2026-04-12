"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// ============================================================
// AUTH HELPER
// ============================================================

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: "Unauthorized", success: false } as const;
  }
  const role = (session.user as { role: string }).role;
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
    return { error: "Forbidden: insufficient permissions", success: false } as const;
  }
  return { userId: session.user.id, role } as const;
}

// ============================================================
// ZOD SCHEMAS
// ============================================================

const settingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(255),
  companyLogo: z.string().optional().nullable(),
  letterheadImage: z.string().optional().nullable(),
  footerImage: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  website: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  invoicePrefix: z.string().min(1, "Invoice prefix is required").max(50),
  currency: z.string().min(1, "Currency is required").max(10),
  currencySymbol: z.string().min(1, "Currency symbol is required").max(10),
  defaultTaxPercentage: z.coerce.number().min(0).max(100).default(0),
  defaultInvoiceNotes: z.string().optional().nullable(),
  defaultInvoiceTerms: z.string().optional().nullable(),
  storeName: z.string().min(1, "Store name is required").max(255),
  storeDescription: z.string().optional().nullable(),
  storeLive: z.boolean().default(false),
  invoiceAffectsStock: z.boolean().default(true),
  orderReservesStock: z.boolean().default(true),
  shippingFee: z.coerce.number().min(0).default(0),
  freeShippingThreshold: z.coerce.number().min(0).optional().nullable(),
});

// ============================================================
// TYPES
// ============================================================

type SettingsData = z.infer<typeof settingsSchema>;

type SettingsDefaults = {
  id: string;
  companyName: string;
  companyLogo: string | null;
  letterheadImage: string | null;
  footerImage: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxNumber: string | null;
  invoicePrefix: string;
  currency: string;
  currencySymbol: string;
  defaultTaxPercentage: number;
  defaultInvoiceNotes: string | null;
  defaultInvoiceTerms: string | null;
  storeName: string;
  storeDescription: string | null;
  storeLive: boolean;
  invoiceAffectsStock: boolean;
  orderReservesStock: boolean;
  shippingFee: number;
  freeShippingThreshold: number | null;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================
// DEFAULT VALUES
// ============================================================

const defaultSettings: Omit<SettingsDefaults, "id" | "createdAt" | "updatedAt"> = {
  companyName: "Multi Solutions Company",
  companyLogo: null,
  letterheadImage: null,
  footerImage: null,
  address: null,
  phone: null,
  email: null,
  website: null,
  taxNumber: null,
  invoicePrefix: "MSC-INV",
  currency: "PKR",
  currencySymbol: "Rs",
  defaultTaxPercentage: 0,
  defaultInvoiceNotes: null,
  defaultInvoiceTerms: null,
  storeName: "Multi Solutions Store",
  storeDescription: null,
  storeLive: false,
  invoiceAffectsStock: true,
  orderReservesStock: true,
  shippingFee: 0,
  freeShippingThreshold: null,
};

// ============================================================
// ACTIONS
// ============================================================

/**
 * Get the first CompanySetting record, or return default values.
 */
async function getSettings(): Promise<{ success: true; data: SettingsDefaults }>;
async function getSettings(): Promise<{ success: boolean; data?: SettingsDefaults; error?: string }>;
async function getSettings() {
  try {
    const settings = await prisma.companySetting.findFirst();

    if (settings) {
      return { success: true, data: settings as SettingsDefaults };
    }

    // Return default values without creating a record
    return {
      success: true,
      data: {
        ...defaultSettings,
        id: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SettingsDefaults,
    };
  } catch {
    return { success: false, error: "Failed to fetch settings" };
  }
}

/**
 * Update company settings. Creates the record if it does not exist.
 */
async function updateSettings(data: SettingsData) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const validated = parsed.data;

  try {
    // Check if a settings record exists
    const existing = await prisma.companySetting.findFirst();

    const settings = existing
      ? await prisma.companySetting.update({
          where: { id: existing.id },
          data: validated,
        })
      : await prisma.companySetting.create({
          data: validated,
        });

    revalidatePath("/settings");

    return { success: true, data: settings as SettingsDefaults };
  } catch {
    return { success: false, error: "Failed to update settings" };
  }
}

/**
 * Handle file upload for company assets (logo, letterhead, footer).
 * Accepts multipart form data with `file` and `category` fields.
 * Saves to /public/uploads/{category}/ and records in UploadedAsset table.
 */
async function uploadCompanyAsset(formData: FormData) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as string) || "general";

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: `File type ${file.type} is not allowed` };
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return { success: false, error: "File size exceeds 5MB limit" };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "png";
    const uniqueName = `${randomUUID()}.${ext}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      category
    );
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const url = `/uploads/${category}/${uniqueName}`;

    // Save to UploadedAsset table
    const asset = await prisma.uploadedAsset.create({
      data: {
        url,
        filename: file.name,
        mimetype: file.type,
        size: file.size,
        category,
      },
    });

    return {
      success: true,
      data: {
        id: asset.id,
        url: asset.url,
        filename: asset.filename,
      },
    };
  } catch {
    return { success: false, error: "File upload failed" };
  }
}

export { getSettings, updateSettings, uploadCompanyAsset };
