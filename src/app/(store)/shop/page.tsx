import { getStoreProducts, getStoreCategories, getStoreBrands } from "@/actions/store";
import { ShopClient } from "@/components/store/shop-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "Shop - Multi Solutions Store",
  description: "Browse our complete catalog of products.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const [productsResult, categoriesResult, brandsResult, session] = await Promise.all([
    getStoreProducts({
      search: params.search,
      categoryId: params.category,
      brand: params.brand,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      sort: (params.sort as "newest" | "price_asc" | "price_desc") || "newest",
      page: params.page ? parseInt(params.page) : 1,
      limit: 12,
    }),
    getStoreCategories(),
    getStoreBrands(),
    getServerSession(authOptions),
  ]);

  const products =
    productsResult.success && productsResult.data ? productsResult.data : null;
  const categories =
    categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];
  const brands =
    brandsResult.success && brandsResult.data ? brandsResult.data : [];

  return (
    <ShopClient
      products={products}
      categories={categories}
      brands={brands}
      currentSearch={params.search || ""}
      currentCategory={params.category || ""}
      currentBrand={params.brand || ""}
      currentMinPrice={params.minPrice || ""}
      currentMaxPrice={params.maxPrice || ""}
      currentSort={params.sort || "newest"}
      isAuthenticated={!!session?.user}
    />
  );
}

