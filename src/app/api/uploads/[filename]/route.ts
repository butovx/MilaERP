import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

interface RouteParams {
  params: Promise<{
    filename: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const filename = (await params).filename;

    // Safely construct file path (Directory Traversal protection)
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), "public", "uploads", safeFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(safeFilename).toLowerCase();

    // Determine MIME type
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") {
      contentType = "image/jpeg";
    } else if (ext === ".png") {
      contentType = "image/png";
    } else if (ext === ".webp") {
      contentType = "image/webp";
    } else if (ext === ".avif") {
      contentType = "image/avif";
    } else if (ext === ".gif") {
      contentType = "image/gif";
    } else if (ext === ".svg") {
      contentType = "image/svg+xml";
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Ошибка при получении локального файла:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
