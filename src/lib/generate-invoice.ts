"use client";

import { jsPDF } from "jspdf";
import { formatCurrency } from "@/lib/slugs";

type InvoiceData = {
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Date | string;
  items: {
    productName: string;
    productSku?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  // Business info
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
};

export function generateInvoicePDF(data: InvoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const primary = [15, 23, 42] as const; // slate-900
  const secondary = [100, 116, 139] as const; // slate-500
  const accent = [59, 130, 246] as const; // blue-500

  // ---- HEADER ----
  doc.setFontSize(22);
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.text(data.businessName || "Multi Solutions Company", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(...secondary);
  doc.setFont("helvetica", "normal");
  if (data.businessAddress) {
    doc.text(data.businessAddress, margin, y);
    y += 4;
  }
  if (data.businessPhone) {
    doc.text(`Phone: ${data.businessPhone}`, margin, y);
    y += 4;
  }
  if (data.businessEmail) {
    doc.text(`Email: ${data.businessEmail}`, margin, y);
    y += 4;
  }

  // INVOICE title on the right
  doc.setFontSize(28);
  doc.setTextColor(...accent);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, margin, { align: "right" });

  // Order number and date
  doc.setFontSize(10);
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "normal");
  const orderDate = new Date(data.createdAt).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Invoice: ${data.orderNumber}`, pageWidth - margin, margin + 10, {
    align: "right",
  });
  doc.text(`Date: ${orderDate}`, pageWidth - margin, margin + 16, {
    align: "right",
  });
  doc.text(
    `Payment: ${data.paymentMethod === "COD" ? "Cash on Delivery" : data.paymentMethod}`,
    pageWidth - margin,
    margin + 22,
    { align: "right" }
  );

  y = Math.max(y, margin + 30) + 10;

  // ---- DIVIDER LINE ----
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ---- BILL TO ----
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", margin, y);
  y += 6;

  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(data.customerName, margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...secondary);

  if (data.customerPhone) {
    doc.text(data.customerPhone, margin, y);
    y += 4;
  }
  if (data.customerEmail) {
    doc.text(data.customerEmail, margin, y);
    y += 4;
  }
  if (data.shippingAddress) {
    doc.text(data.shippingAddress, margin, y);
    y += 4;
  }
  if (data.shippingCity) {
    doc.text(data.shippingCity, margin, y);
    y += 4;
  }

  y += 10;

  // ---- ITEMS TABLE HEADER ----
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(margin, y, contentWidth, 8, "F");

  doc.setFontSize(8);
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");

  const colX = {
    item: margin + 2,
    sku: margin + 80,
    qty: margin + 110,
    price: margin + 130,
    total: pageWidth - margin - 2,
  };

  doc.text("ITEM", colX.item, y + 5.5);
  doc.text("SKU", colX.sku, y + 5.5);
  doc.text("QTY", colX.qty, y + 5.5);
  doc.text("PRICE", colX.price, y + 5.5);
  doc.text("TOTAL", colX.total, y + 5.5, { align: "right" });

  y += 12;

  // ---- ITEMS ----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  for (const item of data.items) {
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    doc.setTextColor(...primary);
    // Truncate long names
    const name =
      item.productName.length > 40
        ? item.productName.substring(0, 37) + "..."
        : item.productName;
    doc.text(name, colX.item, y);

    doc.setTextColor(...secondary);
    doc.text(item.productSku || "—", colX.sku, y);
    doc.text(String(item.quantity), colX.qty, y);
    doc.text(formatCurrency(item.unitPrice), colX.price, y);

    doc.setTextColor(...primary);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(item.lineTotal), colX.total, y, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");

    y += 7;
  }

  y += 5;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ---- TOTALS ----
  const totalsX = pageWidth - margin - 60;

  doc.setFontSize(9);
  doc.setTextColor(...secondary);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", totalsX, y);
  doc.setTextColor(...primary);
  doc.text(formatCurrency(data.subtotal), pageWidth - margin, y, {
    align: "right",
  });
  y += 6;

  if (data.discountAmount > 0) {
    doc.setTextColor(...secondary);
    doc.text("Discount:", totalsX, y);
    doc.setTextColor(22, 163, 74); // green
    doc.text(`-${formatCurrency(data.discountAmount)}`, pageWidth - margin, y, {
      align: "right",
    });
    y += 6;
  }

  if (data.shippingFee > 0) {
    doc.setTextColor(...secondary);
    doc.text("Shipping:", totalsX, y);
    doc.setTextColor(...primary);
    doc.text(formatCurrency(data.shippingFee), pageWidth - margin, y, {
      align: "right",
    });
    y += 6;
  }

  if (data.taxAmount > 0) {
    doc.setTextColor(...secondary);
    doc.text("Tax:", totalsX, y);
    doc.setTextColor(...primary);
    doc.text(formatCurrency(data.taxAmount), pageWidth - margin, y, {
      align: "right",
    });
    y += 6;
  }

  y += 2;
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 5, y, pageWidth - margin, y);
  y += 7;

  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", totalsX, y);
  doc.text(formatCurrency(data.totalAmount), pageWidth - margin, y, {
    align: "right",
  });

  // ---- FOOTER ----
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(...secondary);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Thank you for your business! — Multi Solutions Company",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // Save
  doc.save(`Invoice-${data.orderNumber}.pdf`);
}
