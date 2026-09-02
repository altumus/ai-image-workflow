import { randomUUID } from "node:crypto";
import type { Graph, GraphNode, Run } from "../../../shared/graph.ts";
import { AI_CONCURRENCY } from "../config.ts";
import type { ImageProvider } from "../ai/provider.ts";
import { buildRequest } from "../../../shared/request-builder.ts";
import { getImageInput, getTextInput } from "./io.ts";
import { getPreset } from "./presets.ts";
import type { Preset } from "../../../shared/preset.ts";

export type SchedulerDeps = {
  provider: ImageProvider;
  onUpdate?: (run: Run) => void;
};

export function createRun(graph: Graph, presetId?: string | null, preset?: Preset | null): Run {
  const now = Date.now();
  const jobs = Object.fromEntries(
    graph.nodes.map((node) => [node.id, { nodeId: node.id, status: "idle" as const }]),
  );
  const resolved = preset ?? getPreset(presetId) ?? null;

  return {
    id: randomUUID(),
    status: "queued",
    graph,
    presetId: resolved?.id ?? presetId ?? null,
    preset: resolved,
    jobs,
    createdAt: now,
    updatedAt: now,
  };
}

export async function startRun(run: Run, deps: SchedulerDeps): Promise<void> {
  run.status = "running";
  run.updatedAt = Date.now();
  deps.onUpdate?.(run);
  await continueRun(run, deps);
}

export async function continueRun(run: Run, deps: SchedulerDeps): Promise<void> {
  resolvePassiveSources(run);
  deps.onUpdate?.(run);

  while (true) {
    const ready = run.graph.nodes.filter((node) => isReady(node, run));
    if (ready.length === 0) break;

    const batch = takeBatch(ready, AI_CONCURRENCY);
    for (const node of batch) {
      const job = run.jobs[node.id];
      job.status = "queued";
    }
    touch(run, deps);

    for (const node of batch) {
      const job = run.jobs[node.id];
      job.status = "running";
      job.startedAt = Date.now();
      job.error = undefined;
    }
    touch(run, deps);

    await Promise.all(batch.map((node) => executeNode(node, run, deps)));
    touch(run, deps);
  }

  run.status = finalizeStatus(run);
  run.updatedAt = Date.now();
  deps.onUpdate?.(run);
}

function resolvePassiveSources(run: Run): void {
  for (const node of run.graph.nodes) {
    const job = run.jobs[node.id];
    if (!job || job.status !== "idle") continue;

    if (node.type === "prompt") {
      job.status = "success";
      job.output = { text: node.data.text ?? "" };
      job.finishedAt = Date.now();
    }
    if (node.type === "imageInput") {
      job.status = "success";
      job.output = { imageUrl: node.data.imageUrl };
      job.finishedAt = Date.now();
    }
  }
}

function isReady(node: GraphNode, run: Run): boolean {
  const job = run.jobs[node.id];
  if (!job || job.status !== "idle") return false;
  if (node.type === "prompt" || node.type === "imageInput") return false;

  const incoming = run.graph.edges.filter((edge) => edge.target === node.id);
  for (const edge of incoming) {
    const sourceJob = run.jobs[edge.source];
    if (!sourceJob || sourceJob.status !== "success") return false;
  }

  if (node.type === "generateImage") {
    return Boolean(getTextInput(node, run)?.trim());
  }
  if (node.type === "editImage") {
    return Boolean(getImageInput(node, run)) && Boolean(getTextInput(node, run)?.trim());
  }
  if (node.type === "result") {
    return Boolean(getImageInput(node, run));
  }
  return false;
}

function takeBatch(ready: GraphNode[], limit: number): GraphNode[] {
  const passive = ready.filter(
    (node) => node.type !== "generateImage" && node.type !== "editImage",
  );
  const ai = ready.filter(
    (node) => node.type === "generateImage" || node.type === "editImage",
  );
  return [...passive, ...ai.slice(0, Math.max(1, limit))];
}

async function executeNode(
  node: GraphNode,
  run: Run,
  deps: SchedulerDeps,
): Promise<void> {
  const job = run.jobs[node.id];

  try {
    if (node.type === "result") {
      job.status = "success";
      job.output = { imageUrl: getImageInput(node, run) };
      job.finishedAt = Date.now();
      return;
    }

    if (node.type === "generateImage") {
      const userPrompt = getTextInput(node, run) ?? "";
      const request = buildRequest(userPrompt, run.preset);
      job.request = request;
      const result = await deps.provider.generate({
        prompt: request.prompt,
        references: request.references,
      });
      job.status = "success";
      job.output = { imageUrl: result.url };
      job.finishedAt = Date.now();
      return;
    }

    if (node.type === "editImage") {
      const userPrompt = getTextInput(node, run) ?? "";
      const imageUrl = getImageInput(node, run);
      if (!imageUrl) throw new Error("Missing image input");
      const request = buildRequest(userPrompt, run.preset);
      job.request = { ...request, references: [] };
      const result = await deps.provider.edit({ prompt: request.prompt, imageUrl });
      job.status = "success";
      job.output = { imageUrl: result.url };
      job.finishedAt = Date.now();
      return;
    }

    throw new Error(`Node type ${node.type} is not executable`);
  } catch (error) {
    job.status = "error";
    job.error = error instanceof Error ? error.message : "Unknown error";
    job.finishedAt = Date.now();
  }
}

function finalizeStatus(run: Run): Run["status"] {
  const jobs = Object.values(run.jobs);
  if (jobs.some((job) => job.status === "error")) return "failed";
  if (jobs.some((job) => job.status !== "success")) return "failed";
  return "completed";
}

function touch(run: Run, deps: SchedulerDeps): void {
  run.updatedAt = Date.now();
  deps.onUpdate?.(run);
}

export function readyAiNodeIds(run: Run): string[] {
  return run.graph.nodes
    .filter(
      (node) =>
        (node.type === "generateImage" || node.type === "editImage") &&
        isReady(node, run),
    )
    .map((node) => node.id);
}
