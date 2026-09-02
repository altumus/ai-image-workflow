import fs from "node:fs";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { createMockProvider } from "./ai/mock.ts";
import { createXaiImagineProvider } from "./ai/xai-imagine.ts";
import { PORT, REFERENCES_DIR, UPLOADS_DIR, XAI_API_KEY } from "./config.ts";
import { toSendableImage } from "./domain/images.ts";
import { presetRoutes } from "./routes/presets.ts";
import { runRoutes } from "./routes/runs.ts";
import { uploadRoutes } from "./routes/uploads.ts";

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(REFERENCES_DIR, { recursive: true });

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024 } });
await app.register(fastifyStatic, {
  root: REFERENCES_DIR,
  prefix: "/references/",
  decorateReply: false,
});
await app.register(fastifyStatic, {
  root: UPLOADS_DIR,
  prefix: "/uploads/",
  decorateReply: false,
});

const provider = XAI_API_KEY
  ? createXaiImagineProvider(toSendableImage)
  : createMockProvider(900);

if (!XAI_API_KEY) {
  app.log.warn("XAI_API_KEY is not set — using mock image provider");
}

await presetRoutes(app);
await uploadRoutes(app);
await runRoutes(app, { provider });

app.get("/api/health", async () => ({
  ok: true,
  provider: XAI_API_KEY ? "xai" : "mock",
}));

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
