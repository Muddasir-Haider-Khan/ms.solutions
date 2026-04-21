import { BannerForm } from "@/components/admin/banner-form";

export default function NewBannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Banner</h1>
        <p className="text-muted-foreground">
          Create a new promo slider banner for the homepage.
          Recommended image size: 1600 × 500 px (min width 1200 px).
        </p>
      </div>
      <BannerForm />
    </div>
  );
}
