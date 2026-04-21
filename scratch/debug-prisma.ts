import { PrismaClient, ProductStatus, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const featured = true;
    const limit = 8;
    const skip = 0;
    const sort = "newest";

    const where: Prisma.ProductWhereInput = {
        status: ProductStatus.ACTIVE,
    };

    if (featured) {
        where.featured = true;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
        sort === "price_asc"
        ? { sellingPrice: "asc" }
        : sort === "price_desc"
            ? { sellingPrice: "desc" }
            : sort === "popularity"
            ? { createdAt: "desc" }
            : { createdAt: "desc" };

    console.log("Testing refactored query logic...");
    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
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
            take: limit,
            skip,
            orderBy,
        }),
        prisma.product.count({ where }),
    ]);

    console.log("Found products:", products.length);
    console.log("Total count:", total);
    console.log("Sample product images:", products[0]?.images);

  } catch (error) {
    console.error("Refactored query failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
