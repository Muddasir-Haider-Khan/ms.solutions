import { getOrders } from "@/actions/orders";
import { OrderListClient } from "@/components/admin/order-list-client";

export const metadata = {
  title: "Orders - Admin",
  description: "Manage customer orders",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const result = await getOrders({
    search: params.search,
    status: params.status as
      | "PENDING"
      | "CONFIRMED"
      | "PROCESSING"
      | "SHIPPED"
      | "DELIVERED"
      | "CANCELLED"
      | undefined,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  });

  const orders =
    result.success && result.data ? result.data.orders : [];
  const pagination =
    result.success && result.data ? result.data.pagination : null;

  return (
    <OrderListClient
      orders={orders}
      pagination={pagination}
      currentSearch={params.search || ""}
      currentStatus={params.status || ""}
    />
  );
}
