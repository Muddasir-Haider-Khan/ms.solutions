"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onClear?: () => void;
  label?: string;
  hint?: string;
}

export function ImageUpload({ value, onChange, onClear, label = "Image", hint }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onChange(json.url);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}

      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Preview" className="max-h-48 rounded-lg border object-contain" />
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-[#00796b] hover:bg-[#f0faf9]"
        >
          {uploading ? (
            <Loader2 className="size-8 animate-spin text-[#00796b]" />
          ) : (
            <Upload className="size-8 text-gray-400" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {uploading ? "Uploading…" : "Drag & drop or"}
            </p>
            {!uploading && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-1 text-sm font-semibold text-[#00796b] hover:underline"
              >
                Browse files
              </button>
            )}
          </div>
        </div>
      )}

      {!value && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
