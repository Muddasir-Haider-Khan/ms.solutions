import { writeFile, mkdir } from "fs/promises";
import path from "path";
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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop() || "png";
  const uniqueName = `${randomUUID()}.${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", category);
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, uniqueName);
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${category}/${uniqueName}`,
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
