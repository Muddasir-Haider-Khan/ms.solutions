import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCustomers } from "@/actions/customers";
import { CustomerListClient } from "@/components/admin/customer-list-client";

export default async function CustomersPage() {
  const result = await getCustomers({ page: 1, limit: 100 });

  const customers =
    result?.success && result.data ? result.data.customers : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer directory
          </p>
        </div>
        <Button render={<Link href="/customers/new" />}>
          <Plus className="size-4" />
          Add Customer
        </Button>
      </div>

      <CustomerListClient initialCustomers={customers} />
    </div>
  );
}
