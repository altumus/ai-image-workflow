import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Graph } from "../../../shared/graph.ts";
import type { ImageProvider } from "../ai/provider.ts";
import { createMockProvider } from "../ai/mock.ts";
import { runStore } from "../store/memory.ts";
import { runRoutes } from "./runs.ts";

const graph: Graph = {
  nodes: [
    { id: "p", type: "prompt", position: { x: 0, y: 0 }, data: { text: "a lamp" } },
    { id: "g", type: "generateImage", position: { x: 200, y: 0 }, data: { label: "Generate" } },
    { id: "r", type: "result", position: { x: 400, y: 0 }, data: {} },
  ],
  edges: [
    { id: "e1", source: "p", sourceHandle: "text", target: "g", targetHandle: "text" },
    { id: "e2", source: "g", sourceHandle: "image", target: "r", targetHandle: "image" },
  ],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRun(app: ReturnType<typeof Fastify>, runId: string) {
  for (let i = 0; i < 40; i += 1) {
    const response = await app.inject({ url: `/runs/${runId}` });
    const body = response.json();
    if (body.status === "completed" || body.status === "failed") return body;
    await sleep(25);
  }
  throw new Error("run did not finish");
}

describe("POST /runs", () => {
  beforeEach(() => {
    runStore.clear();
  });

  afterEach(async () => {
    runStore.clear();
  });

  it("returns { runId } and GET /runs/:id reports job + run states", async () => {
    const app = Fastify();
    await runRoutes(app, { provider: createMockProvider(20) });

    const created = await app.inject({
      method: "POST",
      url: "/runs",
      payload: { graph, presetId: "preset-demo" },
    });
    expect(created.statusCode).toBe(200);
    expect(created.json().runId).toBeTruthy();

    const snapshot = await waitForRun(app, created.json().runId);
    expect(snapshot.status).toBe("completed");
    expect(snapshot.presetId).toBe("preset-demo");
    expect(snapshot.preset.id).toBe("preset-demo");
    expect(snapshot.jobs.p.status).toBe("success");
    expect(snapshot.jobs.g.status).toBe("success");
    expect(snapshot.jobs.r.status).toBe("success");
    expect(snapshot.jobs.g.request.presetId).toBe("preset-demo");

    await app.close();
  });

  it("rejects an unknown preset id", async () => {
    const app = Fastify();
    await runRoutes(app, { provider: createMockProvider(10) });
    const created = await app.inject({
      method: "POST",
      url: "/runs",
      payload: { graph, presetId: "missing" },
    });
    expect(created.statusCode).toBe(400);
    expect(created.json().error).toMatch(/Unknown preset/);
    await app.close();
  });

  it("retries a failed generate node", async () => {
    let calls = 0;
    const provider: ImageProvider = {
      async generate() {
        calls += 1;
        if (calls === 1) throw new Error("boom");
        return { url: "mock://retry" };
      },
      async edit() {
        return { url: "mock://edit" };
      },
    };

    const app = Fastify();
    await runRoutes(app, { provider });
    const created = await app.inject({
      method: "POST",
      url: "/runs",
      payload: { graph },
    });
    const runId = created.json().runId as string;
    const failed = await waitForRun(app, runId);
    expect(failed.status).toBe("failed");
    expect(failed.jobs.g.status).toBe("error");

    const retried = await app.inject({
      method: "POST",
      url: `/runs/${runId}/nodes/g/retry`,
    });
    expect(retried.statusCode).toBe(200);

    const snapshot = await waitForRun(app, runId);
    expect(snapshot.status).toBe("completed");
    expect(snapshot.jobs.g.status).toBe("success");
    expect(snapshot.jobs.r.output.imageUrl).toBe("mock://retry");
    expect(calls).toBe(2);
    await app.close();
  });
});
