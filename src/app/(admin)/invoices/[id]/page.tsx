import { notFound } from "next/navigation";
import { getInvoice } from "@/actions/invoices";
import { InvoiceDetail } from "@/components/admin/invoice-detail";

export default async function InvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getInvoice(id);

  if (!result?.success || !result.data) {
    notFound();
  }

  return <InvoiceDetail invoice={result.data} />;
}
