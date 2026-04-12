import { getUsers } from "@/actions/users";
import { UsersListClient } from "@/components/admin/users-list-client";

export const metadata = {
  title: "Users - Admin",
  description: "Manage system users and permissions",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    role?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const result = await getUsers({
    search: params.search,
    role: params.role as
      | "SUPER_ADMIN"
      | "ADMIN"
      | "STAFF"
      | "CUSTOMER"
      | undefined,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  });

  const users =
    result.success && result.data ? result.data.users : [];
  const pagination =
    result.success && result.data ? result.data.pagination : null;

  return (
    <UsersListClient
      users={users}
      pagination={pagination}
      currentSearch={params.search || ""}
      currentRole={params.role || ""}
    />
  );
}
