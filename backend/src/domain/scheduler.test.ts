import { describe, expect, it } from "vitest";
import type { Graph } from "../../../shared/graph.ts";
import { validateGraph } from "../../../shared/validate.ts";
import type { ImageProvider } from "../ai/provider.ts";
import { resetSubtree } from "./io.ts";
import { continueRun, createRun, startRun } from "./scheduler.ts";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const linearGraph: Graph = {
  nodes: [
    {
      id: "p",
      type: "prompt",
      position: { x: 0, y: 0 },
      data: { text: "a red cube" },
    },
    {
      id: "g",
      type: "generateImage",
      position: { x: 240, y: 0 },
      data: { label: "Generate" },
    },
    {
      id: "r",
      type: "result",
      position: { x: 480, y: 0 },
      data: { label: "Result" },
    },
  ],
  edges: [
    {
      id: "e1",
      source: "p",
      sourceHandle: "text",
      target: "g",
      targetHandle: "text",
    },
    {
      id: "e2",
      source: "g",
      sourceHandle: "image",
      target: "r",
      targetHandle: "image",
    },
  ],
};

const branchGraph: Graph = {
  nodes: [
    {
      id: "p",
      type: "prompt",
      position: { x: 0, y: 80 },
      data: { text: "premium lamp" },
    },
    {
      id: "ga",
      type: "generateImage",
      position: { x: 260, y: 0 },
      data: { label: "Generate A" },
    },
    {
      id: "gb",
      type: "generateImage",
      position: { x: 260, y: 180 },
      data: { label: "Generate B" },
    },
    {
      id: "ra",
      type: "result",
      position: { x: 520, y: 0 },
      data: { label: "Result A" },
    },
    {
      id: "rb",
      type: "result",
      position: { x: 520, y: 180 },
      data: { label: "Result B" },
    },
  ],
  edges: [
    { id: "e1", source: "p", sourceHandle: "text", target: "ga", targetHandle: "text" },
    { id: "e2", source: "p", sourceHandle: "text", target: "gb", targetHandle: "text" },
    { id: "e3", source: "ga", sourceHandle: "image", target: "ra", targetHandle: "image" },
    { id: "e4", source: "gb", sourceHandle: "image", target: "rb", targetHandle: "image" },
  ],
};

describe("validateGraph", () => {
  it("accepts the linear and branch scenarios", () => {
    expect(validateGraph(linearGraph).ok).toBe(true);
    expect(validateGraph(branchGraph).ok).toBe(true);
  });

  it("rejects incompatible ports", () => {
    const graph: Graph = {
      nodes: [
        { id: "p", type: "prompt", position: { x: 0, y: 0 }, data: { text: "hi" } },
        { id: "r", type: "result", position: { x: 100, y: 0 }, data: {} },
      ],
      edges: [
        {
          id: "bad",
          source: "p",
          sourceHandle: "text",
          target: "r",
          targetHandle: "image",
        },
      ],
    };
    const result = validateGraph(graph);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Incompatible ports/);
  });

  it("rejects cycles between edit nodes", () => {
    const graph: Graph = {
      nodes: [
        {
          id: "a",
          type: "editImage",
          position: { x: 0, y: 0 },
          data: { text: "one" },
        },
        {
          id: "b",
          type: "editImage",
          position: { x: 160, y: 0 },
          data: { text: "two" },
        },
      ],
      edges: [
        { id: "e1", source: "a", sourceHandle: "image", target: "b", targetHandle: "image" },
        { id: "e2", source: "b", sourceHandle: "image", target: "a", targetHandle: "image" },
      ],
    };
    const result = validateGraph(graph);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/cycle/i);
  });
});

describe("scheduler", () => {
  it("runs independent generate nodes in the same wave", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const provider: ImageProvider = {
      async generate() {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await sleep(80);
        inFlight -= 1;
        return { url: "mock://gen" };
      },
      async edit() {
        return { url: "mock://edit" };
      },
    };

    const run = createRun(branchGraph);
    await startRun(run, { provider });

    expect(maxInFlight).toBe(2);
    expect(run.status).toBe("completed");
    expect(run.jobs.ga.status).toBe("success");
    expect(run.jobs.gb.status).toBe("success");
    expect(run.jobs.ra.output?.imageUrl).toBeDefined();
    expect(run.jobs.rb.output?.imageUrl).toBeDefined();
  });

  it("retries only the failed node and its descendants", async () => {
    let generateCalls = 0;
    const provider: ImageProvider = {
      async generate() {
        generateCalls += 1;
        if (generateCalls === 1) throw new Error("boom");
        return { url: "mock://ok" };
      },
      async edit() {
        return { url: "mock://edit" };
      },
    };

    const run = createRun(linearGraph);
    await startRun(run, { provider });
    expect(run.status).toBe("failed");
    expect(run.jobs.g.status).toBe("error");
    expect(run.jobs.r.status).toBe("idle");

    resetSubtree(run, "g");
    expect(run.jobs.g.status).toBe("idle");
    expect(run.jobs.r.status).toBe("idle");
    expect(run.jobs.p.status).toBe("success");

    await continueRun(run, { provider });
    expect(run.status).toBe("completed");
    expect(run.jobs.g.status).toBe("success");
    expect(run.jobs.r.output?.imageUrl).toBe("mock://ok");
    expect(generateCalls).toBe(2);
  });

  it("applies the preset entity on the backend, not from UI", async () => {
    const provider: ImageProvider = {
      async generate(input) {
        expect(input.prompt).toContain("premium minimal 3D");
        expect(input.prompt).toContain("a red cube");
        expect(input.prompt).toContain("Avoid:");
        expect(input.references).toEqual(["/references/ref-1.jpg", "/references/ref-2.jpg"]);
        return { url: "mock://preset" };
      },
      async edit() {
        return { url: "mock://edit" };
      },
    };

    const run = createRun(linearGraph, "preset-demo");
    expect(run.preset?.id).toBe("preset-demo");
    expect(run.preset?.name).toBe("Premium 3D");

    await startRun(run, { provider });
    expect(run.status).toBe("completed");
    expect(run.jobs.g.request?.presetId).toBe("preset-demo");
    expect(run.jobs.g.request?.mainPrompt).toContain("premium minimal 3D");
    expect(run.jobs.g.request?.references).toHaveLength(2);
  });
});
