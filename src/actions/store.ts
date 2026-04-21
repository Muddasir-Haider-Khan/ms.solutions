"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  StockMovementType,
  Prisma,
} from "@prisma/client";

// ============================================================
// AUTH HELPERS
// ============================================================

async function getAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: session.user.id,
    role: (session.user as { role: string }).role,
  };
}

async function requireAuth() {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized. Please sign in.", success: false } as const;
  return { userId: user.id, role: user.role, success: true } as const;
}

// ============================================================
// ZOD SCHEMAS
// ============================================================

const getStoreProductsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  featured: z.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popularity"]).default("newest"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

const getStoreProductSchema = z.object({
  slug: z.string().min(1),
});

const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().default(1),
});

const updateCartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(0),
});

const removeFromCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
});

const placeOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").max(255),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  shippingCity: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentMethod: z.string().default("COD"),
  guestItems: z.array(z.object({
    productId: z.string(),
    variantId: z.string().nullable().optional(),
    quantity: z.number().int().positive()
  })).optional(),
});

const getOrderSchema = z.object({
  id: z.string().min(1),
});

// ============================================================
// 1. GET STORE PRODUCTS
// ============================================================

export async function getStoreProducts(params?: {
  search?: string;
  categoryId?: string;
  brand?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "popularity";
  page?: number;
  limit?: number;
}) {
  const parsed = getStoreProductsSchema.safeParse(params ?? {});
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { search, categoryId, brand, featured, minPrice, maxPrice, sort, page, limit } =
    parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
  };

  if (categoryId) {
    where.category = { slug: categoryId };
  }

  if (brand) {
    where.brand = { contains: brand, mode: "insensitive" };
  }

  if (featured) {
    where.featured = true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.sellingPrice = {
      ...(minPrice !== undefined && { gte: minPrice }),
      ...(maxPrice !== undefined && { lte: maxPrice }),
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { sellingPrice: "asc" }
      : sort === "price_desc"
        ? { sellingPrice: "desc" }
        : sort === "popularity"
          ? { createdAt: "desc" }
          : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        shortDescription: true,
        sellingPrice: true,
        comparePrice: true,
        brand: true,
        quantityInStock: true,
        featured: true,
        createdAt: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          where: { sortOrder: 0 },
          select: { url: true, altText: true },
          take: 1,
        },
      },
      orderBy,
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

// ============================================================
// 2. GET STORE PRODUCT (by slug)
// ============================================================

export async function getStoreProduct(slug: string) {
  const parsed = getStoreProductSchema.safeParse({ slug });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const product = await prisma.product.findUnique({
    where: { slug: parsed.data.slug },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!product || product.status !== ProductStatus.ACTIVE) {
    return { success: false, error: "Product not found" };
  }

  return { success: true, data: product };
}

// ============================================================
// 3. GET STORE CATEGORIES
// ============================================================

export async function getStoreCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      _count: {
        select: {
          products: {
            where: { status: ProductStatus.ACTIVE },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return { success: true, data: categories };
}

// ============================================================
// 4. GET CART
// ============================================================

export async function getCart() {
  const user = await getAuthUser();
  if (!user) {
    return { success: true, data: null };
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
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
              comparePrice: true,
              quantityInStock: true,
              status: true,
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
              comparePrice: true,
              quantityInStock: true,
              isActive: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cart) {
    return { success: true, data: null };
  }

  return { success: true, data: cart };
}

// ============================================================
// 5. ADD TO CART
// ============================================================

export async function addToCart(data: {
  productId: string;
  variantId?: string;
  quantity?: number;
}) {
  const auth = await requireAuth();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = addToCartSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { productId, variantId, quantity = 1 } = parsed.data;

  // Verify product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      status: true,
      quantityInStock: true,
      trackInventory: true,
      sellingPrice: true,
    },
  });

  if (!product || product.status !== ProductStatus.ACTIVE) {
    return { success: false, error: "Product not found or unavailable" };
  }

  // If variant specified, verify it exists and is active
  if (variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        isActive: true,
        quantityInStock: true,
        productId: true,
      },
    });

    if (!variant || !variant.isActive || variant.productId !== productId) {
      return { success: false, error: "Variant not found or unavailable" };
    }

    if (product.trackInventory && variant.quantityInStock < quantity) {
      return {
        success: false,
        error: `Insufficient stock for variant. Available: ${variant.quantityInStock}`,
      };
    }
  } else {
    // Check product-level stock
    if (product.trackInventory && product.quantityInStock < quantity) {
      return {
        success: false,
        error: `Insufficient stock. Available: ${product.quantityInStock}`,
      };
    }
  }

  try {
    // Ensure cart exists
    let cart = await prisma.cart.findUnique({
      where: { userId: auth.userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: auth.userId },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId,
          variantId: variantId ?? "",
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      // Re-check stock for new total quantity
      if (variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: variantId },
          select: { quantityInStock: true },
        });
        if (variant && product.trackInventory && variant.quantityInStock < newQuantity) {
          return {
            success: false,
            error: `Insufficient stock. Available: ${variant.quantityInStock}, already in cart: ${existingItem.quantity}`,
          };
        }
      } else if (product.trackInventory && product.quantityInStock < newQuantity) {
        return {
          success: false,
          error: `Insufficient stock. Available: ${product.quantityInStock}, already in cart: ${existingItem.quantity}`,
        };
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId ?? undefined,
          quantity,
        },
      });
    }

    revalidatePath("/cart");
    return { success: true, data: { added: true } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add item to cart";
    return { success: false, error: message };
  }
}

// ============================================================
// 6. UPDATE CART ITEM
// ============================================================

export async function updateCartItem(data: {
  productId: string;
  variantId?: string;
  quantity: number;
}) {
  const auth = await requireAuth();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = updateCartItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { productId, variantId, quantity } = parsed.data;

  const cart = await prisma.cart.findUnique({
    where: { userId: auth.userId },
  });

  if (!cart) {
    return { success: false, error: "Cart not found" };
  }

  try {
    // If quantity is 0, remove the item
    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId,
          variantId: variantId ?? null,
        },
      });

      revalidatePath("/cart");
      return { success: true, data: { removed: true } };
    }

    // Check stock before updating
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { quantityInStock: true, trackInventory: true },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { quantityInStock: true },
      });
      if (product.trackInventory && variant && variant.quantityInStock < quantity) {
        return {
          success: false,
          error: `Insufficient stock. Available: ${variant.quantityInStock}`,
        };
      }
    } else if (product.trackInventory && product.quantityInStock < quantity) {
      return {
        success: false,
        error: `Insufficient stock. Available: ${product.quantityInStock}`,
      };
    }

    await prisma.cartItem.update({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId,
          variantId: variantId ?? "",
        },
      },
      data: { quantity },
    });

    revalidatePath("/cart");
    return { success: true, data: { updated: true } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update cart item";
    return { success: false, error: message };
  }
}

// ============================================================
// 7. REMOVE FROM CART
// ============================================================

export async function removeFromCart(data: {
  productId: string;
  variantId?: string;
}) {
  const auth = await requireAuth();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = removeFromCartSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { productId, variantId } = parsed.data;

  const cart = await prisma.cart.findUnique({
    where: { userId: auth.userId },
  });

  if (!cart) {
    return { success: false, error: "Cart not found" };
  }

  try {
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId ?? null,
      },
    });

    revalidatePath("/cart");
    return { success: true, data: { removed: true } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove item from cart";
    return { success: false, error: message };
  }
}

// ============================================================
// 8. CLEAR CART
// ============================================================

export async function clearCart() {
  const auth = await requireAuth();
  if ("error" in auth) return { success: false, error: auth.error };

  const cart = await prisma.cart.findUnique({
    where: { userId: auth.userId },
  });

  if (!cart) {
    return { success: true, data: { cleared: true } };
  }

  try {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    revalidatePath("/cart");
    return { success: true, data: { cleared: true } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to clear cart";
    return { success: false, error: message };
  }
}

// ============================================================
// 9. PLACE ORDER
// ============================================================

export async function placeOrder(data: {
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  notes?: string | null;
  paymentMethod?: string;
  guestItems?: Array<{ productId: string; variantId?: string | null; quantity: number }>;
}) {
  const parsed = placeOrderSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const validated = parsed.data;
  const user = await getAuthUser();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // ----------------------------------------------------------
      // 1. Resolve the cart
      // ----------------------------------------------------------
      let cartId: string | null = null;
      let cartItems: Array<{
        id: string;
        productId: string;
        variantId: string | null;
        quantity: number;
      }> = [];

      if (user) {
        const cart = await tx.cart.findUnique({
          where: { userId: user.id },
          include: { items: true },
        });

        if (cart && cart.items.length > 0) {
          cartId = cart.id;
          cartItems = cart.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          }));
        }
      } else if (validated.guestItems && validated.guestItems.length > 0) {
         cartItems = validated.guestItems.map(item => ({
            id: "guest-" + Math.random(),
            productId: item.productId,
            variantId: item.variantId ?? null,
            quantity: item.quantity
         }));
      }

      if (cartItems.length === 0) {
        throw new Error("Your cart is empty. Add items before placing an order.");
      }

      // ----------------------------------------------------------
      // 2. Validate ALL cart items and gather pricing
      // ----------------------------------------------------------
      interface ResolvedItem {
        productId: string;
        variantId: string | null;
        quantity: number;
        productName: string;
        productSku: string;
        unitPrice: number;
        lineTotal: number;
        trackInventory: boolean;
        availableStock: number;
      }

      const resolvedItems: ResolvedItem[] = [];

      for (const item of cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            sku: true,
            sellingPrice: true,
            status: true,
            quantityInStock: true,
            trackInventory: true,
            taxPercentage: true,
          },
        });

        if (!product || product.status !== ProductStatus.ACTIVE) {
          throw new Error(
            `Product "${product?.name ?? item.productId}" is no longer available.`
          );
        }

        let unitPrice = product.sellingPrice;
        let availableStock = product.quantityInStock;
        let productName = product.name;
        let productSku = product.sku;

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: {
              id: true,
              name: true,
              sku: true,
              sellingPrice: true,
              quantityInStock: true,
              isActive: true,
            },
          });

          if (!variant || !variant.isActive) {
            throw new Error(
              `Variant "${variant?.name ?? item.variantId}" is no longer available.`
            );
          }

          if (variant.sellingPrice !== null && variant.sellingPrice !== undefined) {
            unitPrice = variant.sellingPrice;
          }
          availableStock = variant.quantityInStock;
          productName = `${product.name} - ${variant.name}`;
          productSku = variant.sku;
        }

        // Stock check BEFORE any deductions
        if (product.trackInventory && availableStock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${productName}". Available: ${availableStock}, requested: ${item.quantity}`
          );
        }

        resolvedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          productName,
          productSku,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
          trackInventory: product.trackInventory,
          availableStock,
        });
      }

      // ----------------------------------------------------------
      // 3. Calculate totals
      // ----------------------------------------------------------
      const subtotal = resolvedItems.reduce(
        (sum, item) => sum + item.lineTotal,
        0
      );

      // Fetch company settings for shipping fee & tax
      const settings = await tx.companySetting.findFirst();
      const shippingFee = settings?.shippingFee ?? 0;
      const freeShippingThreshold = settings?.freeShippingThreshold;
      const finalShippingFee =
        freeShippingThreshold && subtotal >= freeShippingThreshold
          ? 0
          : shippingFee;

      const defaultTaxPercentage = settings?.defaultTaxPercentage ?? 0;
      const taxAmount = subtotal * (defaultTaxPercentage / 100);
      const totalAmount = subtotal + finalShippingFee + taxAmount;

      // ----------------------------------------------------------
      // 4. Generate unique order number
      // ----------------------------------------------------------
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // ----------------------------------------------------------
      // 5. Resolve customer linkage
      // ----------------------------------------------------------
      let customerId: string | null = null;
      if (user) {
        const customer = await tx.customer.findFirst({
          where: { userId: user.id },
          select: { id: true },
        });
        if (customer) {
          customerId = customer.id;
        }
      }

      // ----------------------------------------------------------
      // 6. Create the Order
      // ----------------------------------------------------------
      const order = await tx.order.create({
        data: {
          orderNumber,
          status: OrderStatus.PENDING,
          customerName: validated.customerName,
          customerEmail: validated.customerEmail ?? null,
          customerPhone: validated.customerPhone ?? null,
          shippingAddress: validated.shippingAddress ?? null,
          shippingCity: validated.shippingCity ?? null,
          shippingNotes: validated.notes ?? null,
          subtotal,
          shippingFee: finalShippingFee,
          taxAmount,
          totalAmount,
          paymentMethod: validated.paymentMethod ?? "COD",
          paymentStatus: PaymentStatus.UNPAID,
          notes: validated.notes ?? null,
          customerId,
          userId: user?.id ?? null,
          items: {
            create: resolvedItems.map((item) => ({
              productName: item.productName,
              productSku: item.productSku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              productId: item.productId,
              variantId: item.variantId,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // ----------------------------------------------------------
      // 7. Deduct stock for each item (with InventoryTransaction)
      // ----------------------------------------------------------
      for (const item of resolvedItems) {
        if (!item.trackInventory) continue;

        let systemUserId = user?.id;
        if (!systemUserId) {
          const sysAdmin = await tx.user.findFirst({ where: { role: "SUPER_ADMIN" } });
          if (!sysAdmin) throw new Error("No system admin configured for guest transaction.");
          systemUserId = sysAdmin.id;
        }

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { quantityInStock: true },
          });

          if (!variant) {
            throw new Error(`Variant ${item.variantId} not found during stock deduction.`);
          }

          const beforeQuantity = variant.quantityInStock;
          const afterQuantity = beforeQuantity - item.quantity;

          if (afterQuantity < 0) {
            throw new Error(
              `Stock went negative for variant ${item.variantId}. Aborting.`
            );
          }

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { quantityInStock: afterQuantity },
          });

          // Also deduct from parent product aggregate
          const parentProduct = await tx.product.findUnique({
            where: { id: item.productId },
            select: { quantityInStock: true },
          });

          if (parentProduct) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                quantityInStock: parentProduct.quantityInStock - item.quantity,
              },
            });
          }

          await tx.inventoryTransaction.create({
            data: {
              movementType: StockMovementType.ECOMMERCE_SOLD,
              quantity: -item.quantity,
              beforeQuantity,
              afterQuantity,
              referenceType: "order",
              referenceId: order.id,
              notes: `Order ${orderNumber} - variant stock deduction (Guest checkout handled via system)`,
              productId: item.productId,
              variantId: item.variantId,
              createdById: systemUserId,
            },
          });
        } else {
          // Product-level stock deduction (no variant)
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { quantityInStock: true },
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found during stock deduction.`);
          }

          const beforeQuantity = product.quantityInStock;
          const afterQuantity = beforeQuantity - item.quantity;

          if (afterQuantity < 0) {
            throw new Error(
              `Stock went negative for product ${item.productId}. Aborting.`
            );
          }

          await tx.product.update({
            where: { id: item.productId },
            data: { quantityInStock: afterQuantity },
          });

          await tx.inventoryTransaction.create({
            data: {
              movementType: StockMovementType.ECOMMERCE_SOLD,
              quantity: -item.quantity,
              beforeQuantity,
              afterQuantity,
              referenceType: "order",
              referenceId: order.id,
              notes: `Order ${orderNumber} - stock deduction (Guest checkout handled via system)`,
              productId: item.productId,
              createdById: systemUserId,
            },
          });
        }
      }

      // ----------------------------------------------------------
      // 8. Clear the cart
      // ----------------------------------------------------------
      if (cartId) {
        await tx.cartItem.deleteMany({
          where: { cartId },
        });
      }

      return order;
    });

    revalidatePath("/store/cart");
    revalidatePath("/store/checkout");

    let jazzcashPayload: Record<string, string> | undefined = undefined;

    if (validated.paymentMethod === "JAZZCASH") {
      const salt = process.env.JAZZCASH_INTEGRITY_SALT || "";
      const now = new Date();
      now.setHours(now.getHours() + 5); // PKT timezone adjustment roughly
      const txnDateTime = now.toISOString().replace(/[-:T.]/g, "").slice(0, 14);
      
      const expiry = new Date(now.getTime() + 1 * 60 * 60 * 1000);
      const txnExpiryDateTime = expiry.toISOString().replace(/[-:T.]/g, "").slice(0, 14);

      jazzcashPayload = {
        pp_Version: "1.1",
        pp_TxnType: "MWALLET",
        pp_Language: "EN",
        pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID || "",
        pp_SubMerchantID: "",
        pp_Password: process.env.JAZZCASH_PASSWORD || "",
        pp_BankID: "TBANK",
        pp_ProductID: "RETL",
        pp_TxnRefNo: result.orderNumber.replace(/[^a-zA-Z0-9]/g, "").substring(0, 20),
        pp_Amount: Math.round(result.totalAmount * 100).toString(),
        pp_TxnCurrency: "PKR",
        pp_TxnDateTime: txnDateTime,
        pp_BillReference: `billRec${result.orderNumber.substring(0, 10)}`,
        pp_Description: `Order ${result.orderNumber}`,
        pp_TxnExpiryDateTime: txnExpiryDateTime,
        pp_ReturnURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment/jazzcash`,
        pp_SecureHash: "",
        ppmpf_1: "1",
        ppmpf_2: "2",
        ppmpf_3: "3",
        ppmpf_4: "4",
        ppmpf_5: "5",
      };

      const sortedKeys = Object.keys(jazzcashPayload)
        .filter((k) => k !== "pp_SecureHash" && jazzcashPayload![k] !== "")
        .sort();

      const valuesString = sortedKeys.map((k) => jazzcashPayload![k]).join("&");
      const stringToHash = `${salt}&${valuesString}`;

      const hash = crypto.createHmac("sha256", salt).update(stringToHash).digest("hex").toUpperCase();
      jazzcashPayload.pp_SecureHash = hash;
    }

    return {
      success: true,
      data: {
        orderId: result.id,
        orderNumber: result.orderNumber,
        totalAmount: result.totalAmount,
        status: result.status,
        jazzcashPayload,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to place order";
    return { success: false, error: message };
  }
}

// ============================================================
// 10. GET ORDER (for confirmation page)
// ============================================================

export async function getOrder(id: string) {
  const parsed = getOrderSchema.safeParse({ id });
  if (!parsed.success) {
    return {
      success: false,
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
              image: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  return { success: true, data: order };
}

// ============================================================
// 11. GET CUSTOMER ORDERS
// ============================================================

export async function getCustomerOrders() {
  const auth = await requireAuth();
  if ("error" in auth) return { success: false, error: auth.error };

  const orders = await prisma.order.findMany({
    where: { userId: auth.userId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      customerName: true,
      subtotal: true,
      shippingFee: true,
      taxAmount: true,
      totalAmount: true,
      paymentMethod: true,
      paymentStatus: true,
      createdAt: true,
      _count: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: orders };
}

// ============================================================
// 12. GET STORE BRANDS
// ============================================================

export async function getStoreBrands() {
  const brands = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE, brand: { not: null } },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });

  return {
    success: true,
    data: brands.map((b) => b.brand).filter(Boolean) as string[],
  };
}

// ============================================================
// 13. GET RELATED PRODUCTS
// ============================================================

export async function getRelatedProducts(
  productId: string,
  categoryId?: string
) {
  const where: Record<string, unknown> = {
    status: ProductStatus.ACTIVE,
    id: { not: productId },
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      sellingPrice: true,
      comparePrice: true,
      brand: true,
      quantityInStock: true,
      images: {
        where: { sortOrder: 0 },
        select: { url: true, altText: true },
        take: 1,
      },
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return { success: true, data: products };
}
