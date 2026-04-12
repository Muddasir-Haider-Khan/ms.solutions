import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Role, ProductStatus, ProductUnit } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@multisolutions.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@multisolutions.com",
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log("Created super admin:", superAdmin.email);

  const staffPassword = await bcrypt.hash("staff123", 10);
  const staff = await prisma.user.upsert({
    where: { email: "staff@multisolutions.com" },
    update: {},
    create: {
      name: "Ahmed Khan",
      email: "staff@multisolutions.com",
      password: staffPassword,
      role: Role.STAFF,
      isActive: true,
    },
  });
  console.log("Created staff:", staff.email);

  await prisma.companySetting.upsert({
    where: { id: "company-settings-1" },
    update: {},
    create: {
      id: "company-settings-1",
      companyName: "Multi Solutions Company",
      address: "123 Business Avenue, Lahore, Pakistan",
      phone: "+92-300-1234567",
      email: "info@multisolutions.com",
      website: "www.multisolutions.com",
      taxNumber: "NTN-1234567",
      invoicePrefix: "MSC-INV",
      currency: "PKR",
      currencySymbol: "Rs",
      defaultTaxPercentage: 16,
      defaultInvoiceNotes: "Thank you for your business!",
      defaultInvoiceTerms: "Payment is due within 30 days of invoice date.",
      storeName: "Multi Solutions Store",
      storeDescription: "Your one-stop shop for quality products",
      storeLive: true,
      invoiceAffectsStock: true,
      orderReservesStock: true,
      shippingFee: 200,
      freeShippingThreshold: 5000,
    },
  });
  console.log("Created company settings");

  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { name: "Electronics", slug: "electronics", description: "Electronic devices and accessories" },
  });
  const officeSupplies = await prisma.category.upsert({
    where: { slug: "office-supplies" },
    update: {},
    create: { name: "Office Supplies", slug: "office-supplies", description: "Essential office supplies" },
  });
  const stationery = await prisma.category.upsert({
    where: { slug: "stationery" },
    update: {},
    create: { name: "Stationery", slug: "stationery", description: "Writing and art supplies" },
  });
  const compAccessories = await prisma.category.upsert({
    where: { slug: "computer-accessories" },
    update: {},
    create: { name: "Computer Accessories", slug: "computer-accessories", description: "Mouse, keyboards, cables and more" },
  });
  const printing = await prisma.category.upsert({
    where: { slug: "printing" },
    update: {},
    create: { name: "Printing & Paper", slug: "printing", description: "Printers, paper, and ink" },
  });
  console.log("Created categories");

  const products = [
    {
      name: "Wireless Bluetooth Mouse", sku: "MSC-ELEC-001", slug: "wireless-bluetooth-mouse",
      description: "Ergonomic wireless mouse with Bluetooth 5.0 connectivity.", shortDescription: "Ergonomic wireless mouse",
      costPrice: 800, sellingPrice: 1200, comparePrice: 1500, quantityInStock: 50, lowStockThreshold: 10,
      unit: ProductUnit.PIECE, status: ProductStatus.ACTIVE, trackInventory: true, featured: true, taxPercentage: 16,
      brand: "Logitech", categoryId: compAccessories.id,
    },
    {
      name: "USB-C Hub 7-in-1", sku: "MSC-ELEC-002", slug: "usb-c-hub-7in1",
      description: "7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and PD charging.", shortDescription: "7-in-1 USB-C hub adapter",
      costPrice: 2500, sellingPrice: 3800, comparePrice: 4500, quantityInStock: 30, lowStockThreshold: 5,
      unit: ProductUnit.PIECE, status: ProductStatus.ACTIVE, trackInventory: true, featured: true, taxPercentage: 16,
      brand: "Anker", categoryId: compAccessories.id,
    },
    {
      name: "A4 Copy Paper (500 Sheets)", sku: "MSC-PRINT-001", slug: "a4-copy-paper-500",
      description: "Premium quality A4 copy paper, 80gsm, 500 sheets per ream.", shortDescription: "A4 copy paper, 80gsm",
      costPrice: 400, sellingPrice: 650, quantityInStock: 200, lowStockThreshold: 20,
      unit: ProductUnit.PACK, status: ProductStatus.ACTIVE, trackInventory: true, featured: false, taxPercentage: 16,
      brand: "Double A", categoryId: printing.id,
    },
    {
      name: "Premium Ballpoint Pens (Pack of 12)", sku: "MSC-STAT-001", slug: "premium-ballpoint-pens-12",
      description: "Smooth writing ballpoint pens in blue ink. Pack of 12.", shortDescription: "Pack of 12 blue ballpoint pens",
      costPrice: 250, sellingPrice: 450, comparePrice: 500, quantityInStock: 100, lowStockThreshold: 15,
      unit: ProductUnit.PACK, status: ProductStatus.ACTIVE, trackInventory: true, featured: false, taxPercentage: 0,
      brand: "Parker", categoryId: stationery.id,
    },
    {
      name: "Desk Organizer Set", sku: "MSC-OFF-001", slug: "desk-organizer-set",
      description: "Multi-compartment desk organizer with pen holder and phone stand.", shortDescription: "Multi-compartment desk organizer",
      costPrice: 1500, sellingPrice: 2500, comparePrice: 3000, quantityInStock: 25, lowStockThreshold: 5,
      unit: ProductUnit.PIECE, status: ProductStatus.ACTIVE, trackInventory: true, featured: true, taxPercentage: 16,
      brand: "Deli", categoryId: officeSupplies.id,
    },
    {
      name: "Mechanical Keyboard RGB", sku: "MSC-ELEC-003", slug: "mechanical-keyboard-rgb",
      description: "Full-size mechanical keyboard with RGB backlighting, blue switches.", shortDescription: "RGB mechanical keyboard",
      costPrice: 4500, sellingPrice: 6800, comparePrice: 7500, quantityInStock: 15, lowStockThreshold: 3,
      unit: ProductUnit.PIECE, status: ProductStatus.ACTIVE, trackInventory: true, featured: true, taxPercentage: 16,
      brand: "Redragon", categoryId: compAccessories.id,
    },
    {
      name: "HP LaserJet Toner Cartridge", sku: "MSC-PRINT-002", slug: "hp-laserjet-toner",
      description: "Compatible toner cartridge for HP LaserJet Pro series.", shortDescription: "HP LaserJet compatible toner",
      costPrice: 3000, sellingPrice: 5000, quantityInStock: 20, lowStockThreshold: 5,
      unit: ProductUnit.PIECE, status: ProductStatus.ACTIVE, trackInventory: true, featured: false, taxPercentage: 16,
      brand: "HP", categoryId: printing.id,
    },
    {
      name: "Webcam HD 1080p", sku: "MSC-ELEC-004", slug: "webcam-hd-1080p",
      description: "Full HD 1080p webcam with built-in microphone and auto-focus.", shortDescription: "1080p HD webcam with mic",
      costPrice: 2000, sellingPrice: 3500, comparePrice: 4000, quantityInStock: 0, lowStockThreshold: 5,
      unit: ProductUnit.PIECE, status: ProductStatus.ACTIVE, trackInventory: true, featured: false, taxPercentage: 16,
      brand: "Logitech", categoryId: electronics.id,
    },
    {
      name: "Sticky Notes Set (6 Colors)", sku: "MSC-STAT-002", slug: "sticky-notes-set-6-colors",
      description: "Set of 6 colorful sticky note pads. 100 sheets each.", shortDescription: "6-color sticky notes set",
      costPrice: 150, sellingPrice: 300, quantityInStock: 150, lowStockThreshold: 20,
      unit: ProductUnit.PACK, status: ProductStatus.ACTIVE, trackInventory: true, featured: false, taxPercentage: 0,
      brand: "Post-it", categoryId: stationery.id,
    },
    {
      name: "Filing Cabinet 3-Drawer", sku: "MSC-OFF-002", slug: "filing-cabinet-3-drawer",
      description: "Metal 3-drawer filing cabinet with lock.", shortDescription: "3-drawer metal filing cabinet",
      costPrice: 8000, sellingPrice: 12500, comparePrice: 14000, quantityInStock: 8, lowStockThreshold: 2,
      unit: ProductUnit.PIECE, status: ProductStatus.ACTIVE, trackInventory: true, featured: false, taxPercentage: 16,
      brand: "Samurai", categoryId: officeSupplies.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }
  console.log("Created products");

  const customers = [
    { name: "Ali Enterprises", companyName: "Ali Enterprises (Pvt) Ltd", email: "contact@alienterprises.pk", phone: "+92-321-9876543", billingAddress: "45 Industrial Area, Lahore", shippingAddress: "45 Industrial Area, Lahore", taxId: "NTN-9876543" },
    { name: "Sara Ahmed", email: "sara.ahmed@gmail.com", phone: "+92-333-1234567", billingAddress: "12 Gulberg III, Lahore" },
    { name: "Tech Solutions Inc", companyName: "Tech Solutions Inc", email: "orders@techsolutions.pk", phone: "+92-42-35761234", billingAddress: "78 Model Town, Lahore", shippingAddress: "78 Model Town Extension, Lahore", taxId: "NTN-5551234" },
  ];

  for (const c of customers) {
    await prisma.customer.create({ data: c });
  }
  console.log("Created customers");

  console.log("\nSeeding completed!");
  console.log("Login: admin@multisolutions.com / admin123");
  console.log("Staff: staff@multisolutions.com / staff123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
