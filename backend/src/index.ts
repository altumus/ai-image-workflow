import fs from "node:fs";
import path from "node:path";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { createMockProvider } from "./ai/mock.ts";
import { createXaiImagineProvider } from "./ai/xai-imagine.ts";
import {
  AI_BUDGET_USD,
  FRONTEND_DIST,
  PORT,
  REFERENCES_DIR,
  SPEND_FILE,
  UPLOADS_DIR,
  XAI_API_KEY,
} from "./config.ts";
import { createBudgetTracker } from "./domain/budget.ts";
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

const budget = createBudgetTracker({ limitUsd: AI_BUDGET_USD, filePath: SPEND_FILE });
const provider = XAI_API_KEY
  ? budget.wrap(createXaiImagineProvider(toSendableImage))
  : createMockProvider(900);

if (!XAI_API_KEY) {
  app.log.warn("XAI_API_KEY is not set - using mock image provider");
} else {
  app.log.info(budget.snapshot(), "AI spend budget");
}

await presetRoutes(app);
await uploadRoutes(app);
await runRoutes(app, { provider });

app.get("/api/health", async () => ({
  ok: true,
  provider: XAI_API_KEY ? "xai" : "mock",
  budget: budget.snapshot(),
}));

if (fs.existsSync(FRONTEND_DIST)) {
  await app.register(fastifyStatic, {
    root: FRONTEND_DIST,
    prefix: "/",
    decorateReply: false,
    wildcard: false,
  });

  const indexHtml = path.join(FRONTEND_DIST, "index.html");
  app.setNotFoundHandler((request, reply) => {
    const url = request.raw.url ?? "";
    if (isApiPath(url)) {
      return reply.code(404).send({ error: "Not found" });
    }
    return reply.type("text/html").send(fs.readFileSync(indexHtml));
  });
}

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info(`listening on 0.0.0.0:${PORT} (frontend dist ${fs.existsSync(FRONTEND_DIST) ? "yes" : "no"})`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

function isApiPath(url: string): boolean {
  return (
    url.startsWith("/api") ||
    url.startsWith("/runs") ||
    url.startsWith("/presets") ||
    url.startsWith("/uploads") ||
    url.startsWith("/references")
  );
}
