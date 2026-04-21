import { getAllBanners } from "@/actions/banners";
import { BannerForm } from "@/components/admin/banner-form";
import { notFound } from "next/navigation";

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAllBanners();
  const banner = result.success ? result.data?.find((b) => b.id === id) : null;

  if (!banner) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Banner</h1>
        <p className="text-muted-foreground">Update this banner&apos;s content and settings.</p>
      </div>
      <BannerForm initial={banner} />
    </div>
  );
}
