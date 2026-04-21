"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertHeroCard } from "@/actions/hero-cards";
import { ImageUpload } from "./image-upload";

const SLOT_LABELS: Record<number, string> = {
  1: "Slot 1 — Large left banner",
  2: "Slot 2 — Top-right banner",
  3: "Slot 3 — Bottom-right small (left)",
  4: "Slot 4 — Bottom-right small (right)",
};

interface HeroCard {
  slot: number;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl: string;
  bgColor: string;
  isActive: boolean;
}

export function HeroCardForm({ initial }: { initial: HeroCard }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    slot: initial.slot,
    title: initial.title,
    subtitle: initial.subtitle ?? "",
    imageUrl: initial.imageUrl ?? "",
    linkUrl: initial.linkUrl,
    bgColor: initial.bgColor,
    isActive: initial.isActive,
  });

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await upsertHeroCard({
      ...form,
      subtitle: form.subtitle || null,
      imageUrl: form.imageUrl || null,
    });
    if (!result.success) {
      setError(result.error ?? "Unknown error");
      setSaving(false);
      return;
    }
    router.push("/hero-cards");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        Editing: <strong>{SLOT_LABELS[form.slot]}</strong>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Title *</label>
        <input
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#00796b] focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Subtitle</label>
        <input
          value={form.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#00796b] focus:outline-none"
        />
      </div>

      <ImageUpload
        label="Card Image"
        hint={form.slot === 1 ? "Recommended: 800 × 600 px" : "Recommended: 400 × 300 px"}
        value={form.imageUrl || null}
        onChange={(url) => set("imageUrl", url)}
        onClear={() => set("imageUrl", "")}
      />

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Link URL</label>
        <input
          value={form.linkUrl}
          onChange={(e) => set("linkUrl", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#00796b] focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Background Color</label>
        <div className="flex gap-3">
          <input
            type="color"
            value={form.bgColor}
            onChange={(e) => set("bgColor", e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-gray-300"
          />
          <input
            value={form.bgColor}
            onChange={(e) => set("bgColor", e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#00796b] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={form.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="size-4 rounded"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#00796b] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#005f56] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Card"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
