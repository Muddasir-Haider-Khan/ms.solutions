"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBanner, updateBanner } from "@/actions/banners";

interface BannerFormProps {
  initial?: {
    id: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    imageUrl: string;
    linkUrl: string;
    bgColor: string;
    isActive: boolean;
    sortOrder: number;
  };
}

export function BannerForm({ initial }: BannerFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title") as string,
      subtitle: (fd.get("subtitle") as string) || null,
      description: (fd.get("description") as string) || null,
      imageUrl: fd.get("imageUrl") as string,
      linkUrl: (fd.get("linkUrl") as string) || "/shop",
      bgColor: (fd.get("bgColor") as string) || "#1a2035",
      isActive: fd.get("isActive") === "on",
      sortOrder: parseInt(fd.get("sortOrder") as string, 10) || 0,
    };

    const result = initial
      ? await updateBanner(initial.id, data)
      : await createBanner(data);

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong");
    } else {
      router.push("/banners");
      router.refresh();
    }
  }

  const v = initial;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Title *</label>
          <input
            name="title"
            defaultValue={v?.title ?? ""}
            required
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. iPhone 15 Pro Max"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Subtitle</label>
          <input
            name="subtitle"
            defaultValue={v?.subtitle ?? ""}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. New Camera. New Design."
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <input
          name="description"
          defaultValue={v?.description ?? ""}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g. Titanium. So Strong. So Light. So Pro."
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Image URL *</label>
        <input
          name="imageUrl"
          defaultValue={v?.imageUrl ?? ""}
          required
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="https://..."
        />
        <p className="text-xs text-muted-foreground">
          Recommended size: <strong>1600 × 500 px</strong> (minimum width 1200 px, landscape format).
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Link URL</label>
          <input
            name="linkUrl"
            defaultValue={v?.linkUrl ?? "/shop"}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="/shop"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Background Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              name="bgColor"
              defaultValue={v?.bgColor ?? "#1a2035"}
              className="h-9 w-14 cursor-pointer rounded-md border"
            />
            <input
              type="text"
              defaultValue={v?.bgColor ?? "#1a2035"}
              readOnly
              className="flex-1 rounded-md border px-3 py-2 text-sm text-muted-foreground"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Sort Order</label>
          <input
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={v?.sortOrder ?? 0}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">Lower number = shown first</p>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            name="isActive"
            id="isActive"
            defaultChecked={v?.isActive ?? true}
            className="size-4 cursor-pointer rounded"
          />
          <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
            Active (visible on storefront)
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Saving…" : initial ? "Update Banner" : "Create Banner"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border px-5 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
