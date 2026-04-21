import { getAllSocialLinks } from "@/actions/social-links";
import { SocialLinksForm } from "./social-links-form";
import { requireAdminRole } from "@/lib/permissions";

export const metadata = {
  title: "Social Links - Admin",
};

export default async function SocialLinksPage() {
  await requireAdminRole();
  const links = await getAllSocialLinks();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Social Links</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage the social media links displayed in the store footer.
        </p>
      </div>

      <SocialLinksForm initialLinks={links} />
    </div>
  );
}
