import { notFound } from "next/navigation";
import { getOrderDetail } from "@/actions/orders";
import { OrderDetailClient } from "@/components/admin/order-detail-client";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getOrderDetail(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <OrderDetailClient order={result.data as any} />;
}
