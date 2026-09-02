import fs from "node:fs/promises";
import path from "node:path";
import { PUBLIC_DIR, UPLOADS_DIR } from "../config.ts";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function toSendableImage(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const mime = response.headers.get("content-type") || "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  }

  const relative = url.replace(/^\/+/, "");
  const base = relative.startsWith("uploads/") ? path.dirname(UPLOADS_DIR) : PUBLIC_DIR;
  const filePath = path.normalize(path.join(base, relative));
  const allowedRoots = [path.normalize(UPLOADS_DIR), path.normalize(PUBLIC_DIR)];
  if (!allowedRoots.some((root) => filePath.startsWith(root))) {
    throw new Error("Image path is outside allowed directories");
  }

  const buffer = await fs.readFile(filePath);
  const mime = MIME[path.extname(filePath).toLowerCase()] ?? "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
