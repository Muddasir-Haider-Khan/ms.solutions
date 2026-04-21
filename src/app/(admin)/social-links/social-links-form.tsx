"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { upsertSocialLink } from "@/actions/social-links";
import { PLATFORM_LABELS, DEFAULT_PLATFORMS, type SocialPlatform } from "@/lib/social-link-constants";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type SocialLinkData = {
  id: string | null;
  platform: string;
  url: string;
  isActive: boolean;
  order: number;
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  facebook: (
    <svg viewBox="0 0 24 24" className="size-5 fill-[#1877F2]" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-[#E1306C] stroke-2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" className="size-5 fill-[#1DA1F2]">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" className="size-5 fill-[#FF0000]">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
      <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
    </svg>
  ),
};

export function SocialLinksForm({ initialLinks }: { initialLinks: SocialLinkData[] }) {
  const [links, setLinks] = useState(initialLinks);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState<string | null>(null);

  function updateLink(platform: string, field: "url" | "isActive", value: string | boolean) {
    setLinks((prev) =>
      prev.map((l) => l.platform === platform ? { ...l, [field]: value } : l)
    );
  }

  function handleSave(platform: string) {
    const link = links.find((l) => l.platform === platform);
    if (!link) return;

    setSaving(platform);
    startTransition(async () => {
      try {
        await upsertSocialLink({ platform, url: link.url, isActive: link.isActive });
        toast.success(`${PLATFORM_LABELS[platform as SocialPlatform]} saved`);
      } catch {
        toast.error("Failed to save");
      } finally {
        setSaving(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {DEFAULT_PLATFORMS.map((platform) => {
        const link = links.find((l) => l.platform === platform) ?? {
          id: null, platform, url: "", isActive: false, order: 0,
        };
        const isSaving = saving === platform && isPending;

        return (
          <div
            key={platform}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
              {PLATFORM_ICONS[platform]}
            </div>

            <div className="flex-1 min-w-0">
              <Label className="text-sm font-medium text-gray-700">
                {PLATFORM_LABELS[platform as SocialPlatform]}
              </Label>
              <Input
                type="url"
                placeholder={`https://www.${platform}.com/your-page`}
                value={link.url}
                onChange={(e) => updateLink(platform, "url", e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={link.isActive}
                  onChange={(e) => updateLink(platform, "isActive", e.target.checked)}
                  className="size-4 rounded border-gray-300 accent-[#00796b]"
                />
                <span className="text-[12px] text-gray-600">Active</span>
              </label>

              <button
                type="button"
                onClick={() => handleSave(platform)}
                disabled={isSaving}
                className="rounded-lg bg-[#00796b] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#00695c] disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
