import { readFile, stat } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "data", "uploads");

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Prevent path traversal
  if (filename.includes("..") || filename.includes("/")) {
    return new Response("Not found", { status: 404 });
  }

  const filepath = join(UPLOAD_DIR, filename);

  try {
    await stat(filepath);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
  const buffer = await readFile(filepath);

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
