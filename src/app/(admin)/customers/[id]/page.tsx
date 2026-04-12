import { notFound } from "next/navigation";
import { getCustomer } from "@/actions/customers";
import { CustomerForm } from "@/components/admin/customer-form";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getCustomer(id);

  if (!result?.success || !result.data) {
    notFound();
  }

  return <CustomerForm customer={result.data} />;
}
