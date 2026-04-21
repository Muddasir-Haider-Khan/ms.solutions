"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createArticle, updateArticle } from "@/actions/articles";
import { ImageUpload } from "./image-upload";

interface Article {
  id: string;
  title: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  category?: string | null;
  isPublished: boolean;
}

export function ArticleForm({ initial }: { initial?: Article }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    coverImage: initial?.coverImage ?? "",
    category: initial?.category ?? "",
    isPublished: initial?.isPublished ?? false,
  });

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      excerpt: form.excerpt || null,
      coverImage: form.coverImage || null,
      category: form.category || null,
    };
    const result = initial
      ? await updateArticle(initial.id, payload)
      : await createArticle(payload);

    if (!result.success) {
      setError(result.error ?? "Unknown error");
      setSaving(false);
      return;
    }
    router.push("/articles");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
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
          placeholder="Article title"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Category</label>
        <input
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#00796b] focus:outline-none"
          placeholder="e.g. Audio Electronics, Smart Home…"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Excerpt</label>
        <textarea
          rows={2}
          value={form.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#00796b] focus:outline-none"
          placeholder="Short summary shown in listings…"
        />
      </div>

      <ImageUpload
        label="Cover Image"
        hint="Recommended: 1200 × 600 px"
        value={form.coverImage || null}
        onChange={(url) => set("coverImage", url)}
        onClear={() => set("coverImage", "")}
      />

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Content *</label>
        <textarea
          required
          rows={16}
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:border-[#00796b] focus:outline-none"
          placeholder="Write your article content here (HTML or plain text)…"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublished"
          checked={form.isPublished}
          onChange={(e) => set("isPublished", e.target.checked)}
          className="size-4 rounded"
        />
        <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
          Publish immediately
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#00796b] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#005f56] disabled:opacity-60"
        >
          {saving ? "Saving…" : initial ? "Update Article" : "Create Article"}
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
