import { getCustomersForSelect } from "@/actions/customers";
import { getProductsForSelect } from "@/actions/products";
import { InvoiceBuilder } from "@/components/admin/invoice-builder";

export default async function NewInvoicePage() {
  const [customersResult, productsResult] = await Promise.all([
    getCustomersForSelect(),
    getProductsForSelect(),
  ]);

  const customers =
    customersResult?.success && customersResult.data
      ? customersResult.data.map((c) => ({
          id: c.id,
          name: c.name,
          companyName: c.companyName,
          email: c.email,
          phone: c.phone,
        }))
      : [];

  const products =
    productsResult?.success && productsResult.data
      ? productsResult.data.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          sellingPrice: p.sellingPrice,
        }))
      : [];

  return <InvoiceBuilder customers={customers} products={products} />;
}
