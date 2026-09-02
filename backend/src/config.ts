import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(here, "../..");
export const BACKEND_DIR = path.resolve(here, "..");

dotenv.config({ path: path.join(ROOT_DIR, ".env") });
dotenv.config({ path: path.join(BACKEND_DIR, ".env") });

export const PORT = Number(process.env.PORT ?? 3001);
export const XAI_API_KEY = process.env.XAI_API_KEY ?? "";
export const XAI_BASE_URL = process.env.XAI_BASE_URL ?? "https://api.x.ai/v1";
export const XAI_IMAGE_MODEL = process.env.XAI_IMAGE_MODEL ?? "grok-imagine-image-2.0";
export const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 60_000);
export const AI_CONCURRENCY = Number(process.env.AI_CONCURRENCY ?? 4);

export const UPLOADS_DIR = path.join(BACKEND_DIR, "uploads");
export const PUBLIC_DIR = path.join(BACKEND_DIR, "public");
export const REFERENCES_DIR = path.join(PUBLIC_DIR, "references");
