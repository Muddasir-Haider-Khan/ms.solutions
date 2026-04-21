import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { getAllBanners, deleteBanner } from "@/actions/banners";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/permissions";

export default async function BannersPage() {
  await requireAdminRole();
  const result = await getAllBanners();
  const banners = result.success ? (result.data ?? []) : [];

  async function handleDelete(id: string) {
    "use server";
    await deleteBanner(id);
    revalidatePath("/banners");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground">Manage homepage promo slider banners</p>
        </div>
        <Link href="/banners/new">
          <Button>
            <Plus className="size-4" />
            Add Banner
          </Button>
        </Link>
      </div>

      {banners.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No banners yet. Add your first banner.</p>
          <Link href="/banners/new" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            + Add Banner
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="flex items-center gap-4 rounded-xl border bg-card p-4"
            >
              {/* Preview */}
              <div
                className="hidden size-20 shrink-0 overflow-hidden rounded-lg sm:block"
                style={{ background: banner.bgColor }}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="size-full object-cover opacity-70"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{banner.title}</h3>
                  {banner.isActive ? (
                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      <Eye className="size-3" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                      <EyeOff className="size-3" /> Inactive
                    </span>
                  )}
                </div>
                {banner.subtitle && (
                  <p className="mt-0.5 text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Order: {banner.sortOrder} &middot; Link: {banner.linkUrl}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/banners/${banner.id}`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                </Link>
                <form action={handleDelete.bind(null, banner.id)}>
                  <Button variant="destructive" size="sm" type="submit">
                    <Trash2 className="size-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
