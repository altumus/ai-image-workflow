import type { FastifyInstance } from "fastify";
import type { CreateRunRequest } from "../../../shared/graph.ts";
import { validateGraph } from "../../../shared/validate.ts";
import { resetSubtree, snapshotJobs } from "../domain/io.ts";
import { requirePreset } from "../domain/presets.ts";
import { continueRun, createRun, startRun } from "../domain/scheduler.ts";
import { runStore } from "../store/memory.ts";
import type { ImageProvider } from "../ai/provider.ts";

export async function runRoutes(
  app: FastifyInstance,
  deps: { provider: ImageProvider },
): Promise<void> {
  registerRunCollection(app, "/api/runs", deps);
  registerRunCollection(app, "/runs", deps);
}

function registerRunCollection(
  app: FastifyInstance,
  prefix: string,
  deps: { provider: ImageProvider },
): void {
  app.post(prefix, async (request, reply) => {
    const body = request.body as CreateRunRequest;
    if (!body?.graph) {
      return reply.code(400).send({ error: "graph is required" });
    }

    const validation = validateGraph(body.graph);
    if (!validation.ok) {
      return reply.code(400).send({ error: validation.error });
    }

    const presetResult = requirePreset(body.presetId);
    if (!presetResult.ok) {
      return reply.code(400).send({ error: presetResult.error });
    }

    const run = createRun(body.graph, body.presetId, presetResult.preset);
    runStore.set(run);
    void executeInBackground(run.id, () => startRun(run, schedulerDeps(deps)));
    return { runId: run.id };
  });

  app.get(`${prefix}/:runId`, async (request, reply) => {
    const { runId } = request.params as { runId: string };
    const run = runStore.get(runId);
    if (!run) return reply.code(404).send({ error: "Run not found" });
    return {
      id: run.id,
      status: run.status,
      presetId: run.presetId ?? null,
      preset: run.preset ?? null,
      jobs: snapshotJobs(run),
      error: run.error,
      updatedAt: run.updatedAt,
    };
  });

  app.post(`${prefix}/:runId/nodes/:nodeId/retry`, async (request, reply) => {
    const { runId, nodeId } = request.params as { runId: string; nodeId: string };
    const run = runStore.get(runId);
    if (!run) return reply.code(404).send({ error: "Run not found" });
    if (runStore.isExecuting(runId)) {
      return reply.code(409).send({ error: "Run is still executing" });
    }
    const job = run.jobs[nodeId];
    if (!job) return reply.code(404).send({ error: "Node is not part of this run" });
    if (job.status !== "error") {
      return reply.code(400).send({ error: "Only failed nodes can be retried" });
    }

    resetSubtree(run, nodeId);
    run.status = "queued";
    run.error = undefined;
    run.updatedAt = Date.now();
    void executeInBackground(run.id, () => continueRun(run, schedulerDeps(deps)));
    return { runId: run.id, nodeId };
  });
}

function schedulerDeps(deps: { provider: ImageProvider }) {
  return {
    provider: deps.provider,
    onUpdate: () => undefined,
  };
}

async function executeInBackground(runId: string, work: () => Promise<void>): Promise<void> {
  if (runStore.isExecuting(runId)) return;
  runStore.markExecuting(runId);
  try {
    await work();
  } catch (error) {
    const run = runStore.get(runId);
    if (run) {
      run.status = "failed";
      run.error = error instanceof Error ? error.message : "Run failed";
      run.updatedAt = Date.now();
    }
  } finally {
    runStore.markIdle(runId);
  }
}
