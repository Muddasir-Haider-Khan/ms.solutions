import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Role, ProductStatus, ProductUnit } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=500&h=500&fit=crop&auto=format&q=80`;

async function main() {
  console.log("Seeding database...");

  // ── Users ────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@12345", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@msmultisolution.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@msmultisolution.com",
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log("Created super admin:", superAdmin.email);

  const staffPassword = await bcrypt.hash("staff123", 10);
  await prisma.user.upsert({
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

  // ── Company settings ─────────────────────────────────────────────────────
  await prisma.companySetting.upsert({
    where: { id: "company-settings-1" },
    update: {},
    create: {
      id: "company-settings-1",
      companyName: "MS Multi Solution",
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

  // ── Categories ───────────────────────────────────────────────────────────
  const catData = [
    {
      name: "Audio",
      slug: "audio",
      description: "Headphones, earbuds, and audio accessories",
      image: IMG("1505740420928-5e560c06d30e"),
    },
    {
      name: "Camera & Drone",
      slug: "camera-drone",
      description: "Cameras, lenses, drones, and accessories",
      image: IMG("1516035069371-29a1b244cc32"),
    },
    {
      name: "Cell Phones",
      slug: "cell-phones",
      description: "Smartphones and mobile accessories",
      image: IMG("1592750475338-74b7b21085ab"),
    },
    {
      name: "Computers",
      slug: "computers",
      description: "Laptops, desktops, and components",
      image: IMG("1517336714731-489689fd1ca8"),
    },
    {
      name: "Daily Deals",
      slug: "daily-deals",
      description: "Limited-time offers and best deals",
      image: IMG("1607082348824-0a96f2a4b9da"),
    },
    {
      name: "iPad & Tablets",
      slug: "ipad-tablets",
      description: "Tablets and accessories",
      image: IMG("1544244015-0df4b3ffc6b0"),
    },
    {
      name: "Smart Home",
      slug: "smart-home",
      description: "Smart speakers, displays, and home automation",
      image: IMG("1558618666-fcd25c85cd64"),
    },
    {
      name: "Portable Speakers",
      slug: "portable-speakers",
      description: "Bluetooth and portable speakers",
      image: IMG("1608043152269-423dbba4e7e1"),
    },
    {
      name: "TV & Audio",
      slug: "tv-audio",
      description: "Televisions, soundbars, and home theatre",
      image: IMG("1593305841991-05c297ba4575"),
    },
    {
      name: "Wearable Technology",
      slug: "wearable-technology",
      description: "Smartwatches, fitness trackers, and wearables",
      image: IMG("1523275335684-37898b6baf30"),
    },
  ];

  const cats: Record<string, string> = {};
  for (const c of catData) {
    const result = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { image: c.image, description: c.description },
      create: c,
    });
    cats[c.slug] = result.id;
  }
  console.log("Created categories");

  // ── Products ─────────────────────────────────────────────────────────────
  const products = [
    // ── Featured (show in New Arrivals) ────────────────────────────────────
    {
      name: "Sony 5G Headphone",
      sku: "MSE-AUD-001",
      slug: "sony-5g-headphone",
      description:
        "Premium Sony wireless headphones with 5G connectivity support, 30-hour battery life, and active noise cancellation.",
      shortDescription: "Premium Sony ANC wireless headphones",
      costPrice: 32000,
      sellingPrice: 45000,
      comparePrice: 55000,
      quantityInStock: 25,
      lowStockThreshold: 5,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: true,
      taxPercentage: 16,
      brand: "Sony",
      categorySlug: "audio",
      image: IMG("1505740420928-5e560c06d30e"),
    },
    {
      name: "Apple iPhone 15 Pro Max 256GB",
      sku: "MSE-CEL-001",
      slug: "apple-iphone-15-pro-max-256gb",
      description:
        "Apple iPhone 15 Pro Max with A17 Pro chip, titanium design, 48MP camera system, and USB-C connectivity.",
      shortDescription: "iPhone 15 Pro Max 256GB – Titanium",
      costPrice: 290000,
      sellingPrice: 349000,
      comparePrice: 380000,
      quantityInStock: 10,
      lowStockThreshold: 3,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: true,
      taxPercentage: 16,
      brand: "Apple",
      categorySlug: "cell-phones",
      image: IMG("1592750475338-74b7b21085ab"),
    },
    {
      name: "Apple iPhone 14",
      sku: "MSE-CEL-002",
      slug: "apple-iphone-14",
      description:
        "Apple iPhone 14 with A15 Bionic chip, 12MP dual-camera system, Ceramic Shield front, and 5G support.",
      shortDescription: "iPhone 14 – Starlight 128GB",
      costPrice: 165000,
      sellingPrice: 219000,
      comparePrice: 249000,
      quantityInStock: 15,
      lowStockThreshold: 3,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: true,
      taxPercentage: 16,
      brand: "Apple",
      categorySlug: "cell-phones",
      image: IMG("1678685888221-cda773a3dcdb"),
    },
    {
      name: "Ring Wi-Fi Video Doorbell",
      sku: "MSE-SH-001",
      slug: "ring-wifi-video-doorbell",
      description:
        "Ring Video Doorbell with 1080p HD video, two-way talk, motion detection, and easy installation.",
      shortDescription: "1080p HD smart video doorbell",
      costPrice: 12000,
      sellingPrice: 18000,
      comparePrice: 22000,
      quantityInStock: 30,
      lowStockThreshold: 5,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: true,
      taxPercentage: 16,
      brand: "Ring",
      categorySlug: "smart-home",
      image: IMG("1582139329536-e7284fece509"),
    },
    {
      name: "Ring Stick Up Cam Battery",
      sku: "MSE-SH-002",
      slug: "ring-stick-up-cam-battery",
      description:
        "Ring Stick Up Cam Battery – indoor/outdoor security camera with 1080p HD, two-way talk, and customizable motion detection.",
      shortDescription: "Indoor/outdoor HD security camera",
      costPrice: 11000,
      sellingPrice: 15999,
      comparePrice: 19999,
      quantityInStock: 22,
      lowStockThreshold: 5,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: true,
      taxPercentage: 16,
      brand: "Ring",
      categorySlug: "smart-home",
      image: IMG("1558618047-3c8d8f6e0f6e"),
    },
    {
      name: "Arlo Spotlight Camera Security",
      sku: "MSE-SH-003",
      slug: "arlo-spotlight-camera-security",
      description:
        "Arlo Essential Spotlight Camera with 1080p video, color night vision, two-way audio, and built-in spotlight.",
      shortDescription: "Color night vision outdoor security cam",
      costPrice: 28000,
      sellingPrice: 38500,
      comparePrice: 45000,
      quantityInStock: 12,
      lowStockThreshold: 3,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: true,
      taxPercentage: 16,
      brand: "Arlo",
      categorySlug: "smart-home",
      image: IMG("1582139329536-e7284fece509"),
    },
    // ── Regular products ────────────────────────────────────────────────────
    {
      name: "HomePod",
      sku: "MSE-SH-004",
      slug: "apple-homepod",
      description:
        "Apple HomePod with Spatial Audio, room-sensing technology, and Siri intelligence. Immersive 360-degree audio.",
      shortDescription: "Apple smart speaker with Spatial Audio",
      costPrice: 42000,
      sellingPrice: 58000,
      comparePrice: 68000,
      quantityInStock: 8,
      lowStockThreshold: 2,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "Apple",
      categorySlug: "smart-home",
      image: IMG("1589492477829-5e65395b66cc"),
    },
    {
      name: "JBL Go 2",
      sku: "MSE-PS-001",
      slug: "jbl-go-2",
      description:
        "JBL GO 2 waterproof ultra-portable Bluetooth speaker with surprisingly bold JBL sound, 5-hour battery, and IPX7 waterproof rating.",
      shortDescription: "Waterproof ultra-portable Bluetooth speaker",
      costPrice: 3500,
      sellingPrice: 5499,
      comparePrice: 6500,
      quantityInStock: 60,
      lowStockThreshold: 10,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "JBL",
      categorySlug: "portable-speakers",
      image: IMG("1608043152269-423dbba4e7e1"),
    },
    {
      name: "Fujifilm Instax Link Wide",
      sku: "MSE-CAM-001",
      slug: "fujifilm-instax-link-wide",
      description:
        "Fujifilm Instax Link WIDE smartphone printer – prints wide-format instax photos wirelessly via Bluetooth from your phone.",
      shortDescription: "Wireless wide-format instant photo printer",
      costPrice: 14000,
      sellingPrice: 21999,
      comparePrice: 25000,
      quantityInStock: 18,
      lowStockThreshold: 4,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "Fujifilm",
      categorySlug: "camera-drone",
      image: IMG("1526170375885-4d8ecf77b99f"),
    },
    {
      name: "NS-APMWH2 Portable Speaker",
      sku: "MSE-PS-002",
      slug: "ns-apmwh2-portable-speaker",
      description:
        "Yamaha NS-APMWH2 MusicCast 20 wireless speaker with Airplay 2, Alexa built-in, and 360-degree audio.",
      shortDescription: "Yamaha MusicCast 20 wireless speaker",
      costPrice: 10000,
      sellingPrice: 17999,
      comparePrice: 21999,
      quantityInStock: 14,
      lowStockThreshold: 3,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "Yamaha",
      categorySlug: "portable-speakers",
      image: IMG("1545454675-3479a14ba4d6"),
    },
    {
      name: "Crosoft Xbox Elite Controller",
      sku: "MSE-COM-001",
      slug: "crosoft-xbox-elite-controller",
      description:
        "Xbox Elite Wireless Controller Series 2 with adjustable tension thumbsticks, wrap-around rubberized grip, and up to 40 hours of battery.",
      shortDescription: "Xbox Elite Series 2 wireless controller",
      costPrice: 18000,
      sellingPrice: 27999,
      comparePrice: 32000,
      quantityInStock: 20,
      lowStockThreshold: 4,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "Microsoft",
      categorySlug: "computers",
      image: IMG("1612287230202-1ff1d85d1bdf"),
    },
    {
      name: "iPad (10th generation)",
      sku: "MSE-TAB-001",
      slug: "ipad-10th-generation",
      description:
        "iPad 10th generation with A14 Bionic chip, 10.9-inch Liquid Retina display, 5G, and USB-C. Available in four vibrant colors.",
      shortDescription: "10.9-inch iPad with A14 Bionic – 64GB",
      costPrice: 62000,
      sellingPrice: 89999,
      comparePrice: 105000,
      quantityInStock: 17,
      lowStockThreshold: 3,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "Apple",
      categorySlug: "ipad-tablets",
      image: IMG("1544244015-0df4b3ffc6b0"),
    },
    {
      name: "Google Nest Mini",
      sku: "MSE-SH-005",
      slug: "google-nest-mini",
      description:
        "Google Nest Mini – small smart speaker powered by Google Assistant. Stream music, get answers, and control smart home devices.",
      shortDescription: "Google Assistant smart speaker",
      costPrice: 5500,
      sellingPrice: 8499,
      comparePrice: 10000,
      quantityInStock: 45,
      lowStockThreshold: 8,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "Google",
      categorySlug: "smart-home",
      image: IMG("1585386959984-a4155224a1ad"),
    },
    {
      name: "Google Nest Audio",
      sku: "MSE-SH-006",
      slug: "google-nest-audio",
      description:
        "Google Nest Audio – smart speaker with room-filling sound, Google Assistant, and smart home control. 75% stronger bass.",
      shortDescription: "Smart speaker with room-filling sound",
      costPrice: 9000,
      sellingPrice: 14499,
      comparePrice: 17000,
      quantityInStock: 28,
      lowStockThreshold: 5,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "Google",
      categorySlug: "smart-home",
      image: IMG("1558618666-fcd25c85cd64"),
    },
    {
      name: "MacBook Air M2",
      sku: "MSE-COM-002",
      slug: "macbook-air-m2",
      description:
        "Apple MacBook Air with M2 chip, 13.6-inch Liquid Retina display, 8GB RAM, 256GB SSD, and up to 18-hour battery life.",
      shortDescription: "MacBook Air M2 – 13.6-inch 256GB",
      costPrice: 195000,
      sellingPrice: 279000,
      comparePrice: 320000,
      quantityInStock: 7,
      lowStockThreshold: 2,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "Apple",
      categorySlug: "computers",
      image: IMG("1517336714731-489689fd1ca8"),
    },
    {
      name: "Anker Wireless Charger 15W",
      sku: "MSE-ACC-001",
      slug: "anker-wireless-charger-15w",
      description:
        "Anker 15W Wireless Charger Pad – Qi-certified fast charging pad compatible with iPhone, Samsung Galaxy, and all Qi-enabled devices.",
      shortDescription: "Qi-certified 15W fast wireless charging pad",
      costPrice: 2200,
      sellingPrice: 3499,
      comparePrice: 4500,
      quantityInStock: 50,
      lowStockThreshold: 10,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "Anker",
      categorySlug: "daily-deals",
      image: IMG("1556656793-08538906a9f8"),
    },
    {
      name: "Meta Quest 2 VR Headset",
      sku: "MSE-COM-003",
      slug: "meta-quest-2-vr-headset",
      description:
        "Meta Quest 2 all-in-one VR headset with 128GB storage, fast processor, and access to 500+ VR games and experiences.",
      shortDescription: "All-in-one VR headset – 128GB",
      costPrice: 55000,
      sellingPrice: 84999,
      comparePrice: 100000,
      quantityInStock: 9,
      lowStockThreshold: 2,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "Meta",
      categorySlug: "computers",
      image: IMG("1622979135225-d2ba269cf1ac"),
    },
    {
      name: "Apple Watch Series 9",
      sku: "MSE-WT-001",
      slug: "apple-watch-series-9",
      description:
        "Apple Watch Series 9 with S9 chip, double tap gesture, Always-On Retina display, ECG app, and crash detection.",
      shortDescription: "Apple Watch Series 9 – 45mm GPS",
      costPrice: 58000,
      sellingPrice: 82999,
      comparePrice: 95000,
      quantityInStock: 12,
      lowStockThreshold: 3,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "Apple",
      categorySlug: "wearable-technology",
      image: IMG("1523275335684-37898b6baf30"),
    },
    {
      name: "Sony WH-1000XM5 Headphones",
      sku: "MSE-AUD-002",
      slug: "sony-wh-1000xm5",
      description:
        "Sony WH-1000XM5 over-ear noise-cancelling headphones with 8 microphones, 30-hour battery, and multipoint connection.",
      shortDescription: "Industry-leading ANC over-ear headphones",
      costPrice: 42000,
      sellingPrice: 62999,
      comparePrice: 72000,
      quantityInStock: 16,
      lowStockThreshold: 4,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: true,
      taxPercentage: 16,
      brand: "Sony",
      categorySlug: "audio",
      image: IMG("1505740420928-5e560c06d30e"),
    },
    {
      name: "Nest X Yale Smart Lock",
      sku: "MSE-SH-007",
      slug: "nest-x-yale-smart-lock",
      description:
        "Nest x Yale Lock – keyless entry deadbolt that works with Google Home and Nest cameras. No key needed.",
      shortDescription: "Keyless smart deadbolt with Google Home",
      costPrice: 14000,
      sellingPrice: 21499,
      comparePrice: 25999,
      quantityInStock: 11,
      lowStockThreshold: 3,
      unit: ProductUnit.PIECE,
      status: ProductStatus.ACTIVE,
      trackInventory: true,
      featured: false,
      taxPercentage: 16,
      brand: "Yale",
      categorySlug: "smart-home",
      image: IMG("1558618047-3c8d8f6e0f6e"),
    },
  ];

  for (const product of products) {
    const { image, categorySlug, ...productData } = product;
    const categoryId = cats[categorySlug];

    const created = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: { ...productData, categoryId },
      create: { ...productData, categoryId },
    });

    // Refresh images every seed run
    await prisma.productImage.deleteMany({ where: { productId: created.id } });
    await prisma.productImage.create({
      data: { url: image, altText: productData.name, productId: created.id, sortOrder: 0 },
    });
  }
  console.log("Created products with images");

  // ── Customers ────────────────────────────────────────────────────────────
  const customerCount = await prisma.customer.count();
  if (customerCount === 0) {
    await prisma.customer.createMany({
      data: [
        { name: "Ali Enterprises", companyName: "Ali Enterprises (Pvt) Ltd", email: "contact@alienterprises.pk", phone: "+92-321-9876543", billingAddress: "45 Industrial Area, Lahore", shippingAddress: "45 Industrial Area, Lahore", taxId: "NTN-9876543" },
        { name: "Sara Ahmed", email: "sara.ahmed@gmail.com", phone: "+92-333-1234567", billingAddress: "12 Gulberg III, Lahore" },
        { name: "Tech Solutions Inc", companyName: "Tech Solutions Inc", email: "orders@techsolutions.pk", phone: "+92-42-35761234", billingAddress: "78 Model Town, Lahore", shippingAddress: "78 Model Town Extension, Lahore", taxId: "NTN-5551234" },
      ],
    });
    console.log("Created customers");
  }

  // ── Sample Articles ────────────────────────────────────────────────────────
  const articleCount = await prisma.article.count();
  if (articleCount === 0) {
    const sampleArticles = [
      {
        title: "Announcing the New Fitbit Charge 6",
        slug: "announcing-new-fitbit-charge-6",
        excerpt: "The Fitbit Charge 6 brings Google Maps navigation, YouTube Music controls, and ECG sensor — the most feature-packed Charge yet.",
        content: `<h2>What's New in Fitbit Charge 6?</h2><p>Fitbit has released the Charge 6 with a completely new form factor and Google integration at its core. The device now includes real-time GPS, heart rate monitoring, and ECG capabilities.</p><h3>Key Features</h3><ul><li>Google Maps turn-by-turn navigation</li><li>YouTube Music and Spotify controls</li><li>Advanced sleep tracking with HRV</li><li>Built-in GPS (no phone needed)</li><li>7-day battery life</li></ul><p>Available in three colorways: Coral, Obsidian, and Porcelain. Starting at Rs 49,999.</p>`,
        coverImage: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1200&h=600&fit=crop&auto=format&q=80",
        category: "Wearable Technology",
        isPublished: true,
        publishedAt: new Date("2024-01-02"),
      },
      {
        title: "How to Improve Your Amazon Conversion Rate",
        slug: "improve-amazon-conversion-rate",
        excerpt: "Practical tips to boost your product listings and drive more sales through optimized imagery, pricing, and descriptions.",
        content: `<h2>Optimizing Your Amazon Product Listings</h2><p>With millions of products listed on Amazon, standing out requires more than just a good product. Here are five proven techniques to improve your conversion rate.</p><h3>1. High-Quality Product Images</h3><p>Use a white background for the main image and show all angles. Include lifestyle photos and infographics to explain features.</p><h3>2. Compelling Product Title</h3><p>Include your main keywords, brand name, and key features in the first 80 characters.</p><h3>3. Competitive Pricing</h3><p>Monitor competitor pricing daily and use dynamic repricing tools when volume justifies it.</p><h3>4. A+ Content</h3><p>Use Enhanced Brand Content to tell your brand story, compare models, and showcase benefits.</p><h3>5. Reviews & Ratings</h3><p>Prompt buyers with follow-up emails and respond to all reviews — positive and negative.</p>`,
        coverImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=600&fit=crop&auto=format&q=80",
        category: "Business Tips",
        isPublished: true,
        publishedAt: new Date("2024-02-14"),
      },
      {
        title: "Sony WH-1000XM5 vs Bose QuietComfort 45",
        slug: "sony-wh1000xm5-vs-bose-qc45",
        excerpt: "We put the two best noise-cancelling headphones head to head. Which one should you buy in 2024?",
        content: `<h2>The Ultimate Noise-Cancelling Headphone Showdown</h2><p>Both the Sony WH-1000XM5 and Bose QuietComfort 45 are excellent choices, but they have different strengths.</p><h3>Noise Cancellation</h3><p>Sony's eight-microphone system with two processors delivers class-leading ANC that virtually silences airplane cabin noise. Bose's Quiet Comfort technology remains outstanding but a step behind Sony in 2024.</p><h3>Sound Quality</h3><p>Sony has a slight V-shape EQ with bass emphasis. Bose leans more neutral and audiophile-friendly. Both support multipoint Bluetooth (2 devices simultaneously).</p><h3>Battery Life</h3><p>Sony: 30 hours ANC on / 40 hours off. Bose: 24 hours ANC on. Sony wins here.</p><h3>Comfort</h3><p>Bose QC45 edges out with softer ear cushions for extended wear. Sony's flat-fold design is more portable.</p><h3>Verdict</h3><p>If noise cancellation is the priority, go Sony. If all-day comfort matters most, Bose is the better pick.</p>`,
        coverImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=600&fit=crop&auto=format&q=80",
        category: "Audio Electronics",
        isPublished: true,
        publishedAt: new Date("2024-03-14"),
      },
      {
        title: "Top 5 Smart Home Gadgets for 2024",
        slug: "top-5-smart-home-gadgets-2024",
        excerpt: "From smart locks to AI-powered cameras, these are the gadgets that will make your home smarter and safer this year.",
        content: `<h2>Make Your Home Smarter in 2024</h2><p>The smart home market has exploded with affordable, easy-to-install devices. Here are the five products we recommend most.</p><h3>1. Google Nest Audio</h3><p>The best smart speaker for Google Home users. Rich bass, clear highs, and tight Google Assistant integration at an affordable price.</p><h3>2. Ring Video Doorbell (4th Gen)</h3><p>See and speak to visitors from anywhere. Pre-roll video captures 4 seconds before motion is detected. Works with Alexa and Google.</p><h3>3. Nest x Yale Smart Lock</h3><p>Keyless entry with PIN codes, NFC access cards, and remote locking via the Google Home app. Tamper alerts included.</p><h3>4. Arlo Pro 4 Camera</h3><p>2K video, color night vision, and built-in spotlight. No hub required — connects directly to Wi-Fi.</p><h3>5. Anker Eufy RoboVac</h3><p>Quiet, powerful suction with smart mapping. Schedules cleaning from your phone and returns to dock automatically.</p>`,
        coverImage: "https://images.unsplash.com/photo-1558618047-3c8d8f6e0f6e?w=1200&h=600&fit=crop&auto=format&q=80",
        category: "Smart Home",
        isPublished: true,
        publishedAt: new Date("2024-04-08"),
      },
    ];

    await prisma.article.createMany({ data: sampleArticles });
    console.log("Created sample articles");
  }

  console.log("\nSeeding completed!");
  console.log("Admin: admin@msmultisolution.com / Admin@12345");
  console.log("Staff: staff@multisolutions.com / staff123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
