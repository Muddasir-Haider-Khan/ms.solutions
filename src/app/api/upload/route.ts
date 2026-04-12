import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/upload";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "STAFF"].includes((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = (formData.get("category") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await uploadFile(file, category);

    // Save metadata to database
    const asset = await prisma.uploadedAsset.create({
      data: {
        url: result.url,
        filename: result.filename,
        mimetype: result.mimetype,
        size: result.size,
        category,
      },
    });

    return NextResponse.json({ success: true, data: { ...result, id: asset.id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
