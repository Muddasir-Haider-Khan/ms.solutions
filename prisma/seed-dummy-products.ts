import { prisma } from "../src/lib/prisma";
import { slugify } from "../src/lib/slugs";

async function main() {
  // Check if "Electronics" category exists
  let category = await prisma.category.findFirst({
    where: { name: "Electronics" }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: "Electronics",
        slug: "electronics",
        description: "Premium electronic devices and accessories",
        isActive: true,
      }
    });
  }

  const products = [
    {
      name: "Titanium Pro Max Smartphone",
      slug: slugify("Titanium Pro Max Smartphone"),
      sku: "TPM-001",
      brand: "Applex",
      shortDescription: "Experience the ultimate pro power with aerospace-grade titanium design and the most advanced camera system.",
      description: "Experience the ultimate pro power with aerospace-grade titanium design. It features a stunning Super Retina XDR display, a powerful A-Series Bionic chip, and an advanced camera system that captures incredible detail in any lighting condition. Built for the professionals who demand the best.",
      costPrice: 200000,
      sellingPrice: 350000,
      comparePrice: 380000,
      quantityInStock: 25,
      lowStockThreshold: 5,
      unit: "PIECE",
      status: "ACTIVE",
      featured: true,
      categoryId: category.id,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=2000&auto=format&fit=crop",
            altText: "Titanium Pro Max",
            sortOrder: 0
          }
        ]
      }
    },
    {
      name: "M-Series Laptop Pro 16\"",
      slug: slugify("M-Series Laptop Pro 16"),
      sku: "MLP-016",
      brand: "Applex",
      shortDescription: "Mind-blowing performance. Boundary-breaking battery life.",
      description: "The ultimate pro laptop. With the wildly powerful M-Series chip, it delivers mind-blowing performance and boundary-breaking battery life. Features a stunning Liquid Retina XDR display, an array of pro ports, and a legendary Magic Keyboard.",
      costPrice: 400000,
      sellingPrice: 550000,
      comparePrice: null,
      quantityInStock: 15,
      lowStockThreshold: 3,
      unit: "PIECE",
      status: "ACTIVE",
      featured: true,
      categoryId: category.id,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2000&auto=format&fit=crop",
            altText: "M-Series Laptop Pro",
            sortOrder: 0
          }
        ]
      }
    },
    {
      name: "Ultra Smartwatch Extreme",
      slug: slugify("Ultra Smartwatch Extreme"),
      sku: "USW-XTR",
      brand: "Applex",
      shortDescription: "Rugged and capable. The most extreme smartwatch ever.",
      description: "Built to push boundaries. Aerospace-grade titanium case, precision dual-frequency GPS, up to 36 hours of battery life, and cellular connectivity. Designed for athletes, adventurers, and explorers.",
      costPrice: 150000,
      sellingPrice: 220000,
      comparePrice: 250000,
      quantityInStock: 40,
      lowStockThreshold: 10,
      unit: "PIECE",
      status: "ACTIVE",
      featured: false,
      categoryId: category.id,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1434493789847-2902a52dda8c?q=80&w=2000&auto=format&fit=crop",
            altText: "Ultra Smartwatch",
            sortOrder: 0
          }
        ]
      }
    },
    {
      name: "Noise Cancelling Earbuds Pro",
      slug: slugify("Noise Cancelling Earbuds Pro"),
      sku: "NCE-PRO",
      brand: "AudioTech",
      shortDescription: "Rebuilt from the sound up for a richer audio experience.",
      description: "Next-level active noise cancellation and adaptive transparency. Personalized spatial audio immerses you in sound. MagSafe charging case provides multiple full charges for hours of listening time.",
      costPrice: 35000,
      sellingPrice: 65000,
      comparePrice: 75000,
      quantityInStock: 100,
      lowStockThreshold: 15,
      unit: "PIECE",
      status: "ACTIVE",
      featured: true,
      categoryId: category.id,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?q=80&w=2000&auto=format&fit=crop",
            altText: "Earbuds Pro",
            sortOrder: 0
          }
        ]
      }
    }
  ];

  console.log("Seeding dummy products...");
  for (const product of products) {
    try {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product as any,
      });
      console.log(`✓ Inserted ${product.name}`);
    } catch (e) {
      console.error(`Failed to insert ${product.name}`, e);
    }
  }
  
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
