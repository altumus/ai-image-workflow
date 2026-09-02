import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { UPLOADS_DIR } from "../config.ts";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
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
