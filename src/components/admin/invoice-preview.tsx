"use client";

import { formatCurrency, formatDate } from "@/lib/slugs";

// ============================================================
// Types
// ============================================================

type InvoiceItem = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  lineTotal: number;
  sortOrder: number;
  productId: string | null;
  product: { id: string; name: string; sku: string } | null;
  productVariant: { id: string; name: string; sku: string } | null;
};

type InvoiceData = {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentStatus: string;
  issueDate: Date | string;
  dueDate: Date | string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  notes: string | null;
  terms: string | null;
  affectsStock: boolean;
  stockDeducted: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  customer: {
    id: string;
    name: string;
    companyName: string | null;
    email: string | null;
    phone: string | null;
    billingAddress: string | null;
    shippingAddress: string | null;
    taxId: string | null;
  } | null;
  billToName: string | null;
  billToCompany: string | null;
  billToEmail: string | null;
  billToPhone: string | null;
  billToAddress: string | null;
  createdBy: { id: string; name: string; email: string };
  items: InvoiceItem[];
  payments: {
    id: string;
    amount: number;
    paymentDate: Date | string;
    method: string;
  }[];
};

interface InvoicePreviewProps {
  invoice: InvoiceData;
  companyInfo?: {
    companyName?: string;
    address?: string;
    phone?: string;
    email?: string;
    taxNumber?: string;
    logo?: string;
  };
}

// ============================================================
// Component
// ============================================================

export function InvoicePreview({ invoice, companyInfo }: InvoicePreviewProps) {
  const company = companyInfo || {
    companyName: "MS Solutions",
    address: "",
    phone: "",
    email: "",
    taxNumber: "",
  };

  const balanceDue = invoice.totalAmount - invoice.amountPaid;

  return (
    <>
      {/* Print styles injected */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-print-area,
          .invoice-print-area * {
            visibility: visible;
          }
          .invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="invoice-print-area bg-white text-black rounded-lg border shadow-sm">
        <div className="mx-auto max-w-[210mm] p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <img src="/images/logo.png" alt="MS Solutions" className="h-12 w-auto object-contain mb-2 print:h-16" />
              {company.address && (
                <p className="text-sm text-gray-600 mt-1">{company.address}</p>
              )}
              <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                {company.phone && <p>Phone: {company.phone}</p>}
                {company.email && <p>Email: {company.email}</p>}
                {company.taxNumber && <p>Tax/NTN: {company.taxNumber}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-wider">
                Invoice
              </h2>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </span>
                </p>
                <p>Date: {formatDate(invoice.issueDate)}</p>
                {invoice.dueDate && (
                  <p>Due: {formatDate(invoice.dueDate)}</p>
                )}
              </div>
              <div className="mt-2">
                <span
                  className={`inline-block rounded px-2 py-1 text-xs font-semibold uppercase ${
                    invoice.status === "PAID"
                      ? "bg-green-100 text-green-800"
                      : invoice.status === "CANCELLED"
                      ? "bg-red-100 text-red-800"
                      : invoice.status === "DRAFT"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Bill To
              </h3>
              <div className="text-sm space-y-0.5">
                {invoice.billToName && (
                  <p className="font-semibold text-gray-900">
                    {invoice.billToName}
                  </p>
                )}
                {invoice.billToCompany && (
                  <p className="text-gray-600">{invoice.billToCompany}</p>
                )}
                {invoice.billToEmail && (
                  <p className="text-gray-600">{invoice.billToEmail}</p>
                )}
                {invoice.billToPhone && (
                  <p className="text-gray-600">{invoice.billToPhone}</p>
                )}
                {invoice.billToAddress && (
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {invoice.billToAddress}
                  </p>
                )}
                {!invoice.billToName && invoice.customer && (
                  <>
                    <p className="font-semibold text-gray-900">
                      {invoice.customer.name}
                    </p>
                    {invoice.customer.companyName && (
                      <p className="text-gray-600">
                        {invoice.customer.companyName}
                      </p>
                    )}
                    {invoice.customer.email && (
                      <p className="text-gray-600">
                        {invoice.customer.email}
                      </p>
                    )}
                    {invoice.customer.phone && (
                      <p className="text-gray-600">
                        {invoice.customer.phone}
                      </p>
                    )}
                    {invoice.customer.billingAddress && (
                      <p className="text-gray-600 whitespace-pre-wrap">
                        {invoice.customer.billingAddress}
                      </p>
                    )}
                  </>
                )}
                {!invoice.billToName && !invoice.customer && (
                  <p className="text-gray-400 italic">No customer specified</p>
                )}
              </div>
            </div>
            {invoice.customer?.taxId && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Customer Tax ID
                </h3>
                <p className="text-sm text-gray-600">{invoice.customer.taxId}</p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-2 px-2 font-semibold text-gray-900 w-8">
                  #
                </th>
                <th className="text-left py-2 px-2 font-semibold text-gray-900">
                  Description
                </th>
                <th className="text-right py-2 px-2 font-semibold text-gray-900 w-16">
                  Qty
                </th>
                <th className="text-right py-2 px-2 font-semibold text-gray-900 w-24">
                  Unit Price
                </th>
                <th className="text-right py-2 px-2 font-semibold text-gray-900 w-16">
                  Tax
                </th>
                <th className="text-right py-2 px-2 font-semibold text-gray-900 w-16">
                  Disc
                </th>
                <th className="text-right py-2 px-2 font-semibold text-gray-900 w-24">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-2 px-2 text-gray-500">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </p>
                    )}
                    {item.product && (
                      <p className="text-xs text-gray-400">
                        SKU: {item.product.sku}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-600">
                    {item.taxRate > 0 ? `${item.taxRate}%` : "-"}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-600">
                    {item.discount > 0 ? `${item.discount}%` : "-"}
                  </td>
                  <td className="py-2 px-2 text-right font-medium text-gray-900">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-700">
                    -{formatCurrency(invoice.discountAmount)}
                  </span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">
                    {formatCurrency(invoice.taxAmount)}
                  </span>
                </div>
              )}
              <hr className="border-gray-300" />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900">Grand Total</span>
                <span className="text-gray-900">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
              {invoice.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid</span>
                    <span className="text-green-700">
                      {formatCurrency(invoice.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-gray-900">Balance Due</span>
                    <span
                      className={
                        balanceDue > 0 ? "text-red-700" : "text-green-700"
                      }
                    >
                      {formatCurrency(balanceDue)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-200">
              {invoice.notes && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Notes
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {invoice.notes}
                  </p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Terms & Conditions
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {invoice.terms}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
            <p>Thank you for your business</p>
          </div>
        </div>
      </div>
    </>
  );
}
