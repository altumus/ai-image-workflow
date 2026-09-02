import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { UPLOADS_DIR } from "../config.ts";
import { toSendableImage } from "../domain/images.ts";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/download", async (request, reply) => {
    const query = request.query as { src?: string; name?: string };
    const src = query.src ?? "";
    if (!src) return reply.code(400).send({ error: "src is required" });

    try {
      const { buffer, mime, filename } = await loadDownload(src, query.name);
      return reply
        .header("Content-Type", mime)
        .header("Content-Disposition", `attachment; filename="${filename}"`)
        .send(buffer);
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Download failed",
      });
    }
  });

  app.post("/api/uploads", async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ error: "File is required" });
    }
    if (!ALLOWED.has(file.mimetype)) {
      return reply.code(400).send({ error: "Only png, jpeg, webp, gif are allowed" });
    }

    const ext = extFromMime(file.mimetype);
    const name = `${randomUUID()}${ext}`;
    const target = path.join(UPLOADS_DIR, name);
    await fs.writeFile(target, await file.toBuffer());
    return { url: `/uploads/${name}` };
  });
}

function extFromMime(mime: string): string {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".jpg";
}

async function loadDownload(
  src: string,
  name?: string,
): Promise<{ buffer: Buffer; mime: string; filename: string }> {
  if (src.startsWith("data:")) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(src);
    if (!match) throw new Error("Invalid data URL");
    const mime = match[1];
    return {
      buffer: Buffer.from(match[2], "base64"),
      mime,
      filename: safeName(name, extFromMime(mime)),
    };
  }

  if (src.startsWith("/uploads/") || src.startsWith("/references/")) {
    const dataUri = await toSendableImage(src);
    return loadDownload(dataUri, name);
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Failed to fetch image ${response.status}`);
    const mime = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, mime, filename: safeName(name, extFromMime(mime)) };
  }

  throw new Error("Unsupported image source");
}

function safeName(name: string | undefined, ext: string): string {
  const base = (name ?? "result").replace(/[^\w.-]+/g, "_").slice(0, 80);
  return base.endsWith(ext) ? base : `${base}${ext}`;
}
