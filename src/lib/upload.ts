import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadFile(
  file: File,
  category: string = "general"
): Promise<{ url: string; filename: string; mimetype: string; size: number }> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 5MB limit");
  }

  const ext = file.name.split(".").pop() || "png";
  const uniqueName = `${category}/${randomUUID()}.${ext}`;

  // Use Vercel Blob for storage
  const blob = await put(uniqueName, file, {
    access: "public",
    addRandomSuffix: false, // We're already making it unique
  });

  return {
    url: blob.url,
    filename: file.name,
    mimetype: file.type,
    size: file.size,
  };
}

export async function uploadMultiple(
  files: File[],
  category: string = "general"
) {
  const results = [];
  for (const file of files) {
    results.push(await uploadFile(file, category));
  }
  return results;
}
