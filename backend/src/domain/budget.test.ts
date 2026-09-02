import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ImageProvider } from "../ai/provider.ts";
import { BudgetExceededError, createBudgetTracker } from "./budget.ts";

function tempFile(): string {
  return path.join(os.tmpdir(), `spend-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
}

describe("AI budget", () => {
  it("blocks further calls after the USD cap", async () => {
    const filePath = tempFile();
    const tracker = createBudgetTracker({ limitUsd: 0.08, filePath });
    let calls = 0;
    const inner: ImageProvider = {
      async generate() {
        calls += 1;
        return { url: "mock://ok" };
      },
      async edit() {
        return { url: "mock://edit" };
      },
    };
    const provider = tracker.wrap(inner);

    await provider.generate({ prompt: "one" });
    await expect(provider.generate({ prompt: "two" })).rejects.toBeInstanceOf(BudgetExceededError);
    expect(calls).toBe(1);
    expect(tracker.snapshot().spentUsd).toBe(0.05);

    const restored = createBudgetTracker({ limitUsd: 0.08, filePath });
    expect(restored.snapshot().spentUsd).toBe(0.05);
    fs.unlinkSync(filePath);
  });

  it("does not charge when the provider throws", async () => {
    const filePath = tempFile();
    const tracker = createBudgetTracker({ limitUsd: 5, filePath });
    const inner: ImageProvider = {
      async generate() {
        throw new Error("upstream");
      },
      async edit() {
        return { url: "mock://edit" };
      },
    };

    await expect(tracker.wrap(inner).generate({ prompt: "x" })).rejects.toThrow("upstream");
    expect(tracker.snapshot().spentUsd).toBe(0);
  });
});
