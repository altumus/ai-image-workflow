import fs from "node:fs";
import path from "node:path";
import type { EditInput, GenerateInput, ImageProvider } from "../ai/provider.ts";

export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export type BudgetSnapshot = {
  limitUsd: number | null;
  spentUsd: number;
  remainingUsd: number | null;
};

type SpendFile = {
  spentUsd: number;
};

const GENERATE_USD = 0.05;
const EDIT_USD = 0.07;
const PER_INPUT_IMAGE_USD = 0.01;

export function estimateGenerateCost(input: GenerateInput): number {
  if (input.references?.length) {
    return roundUsd(EDIT_USD + input.references.length * PER_INPUT_IMAGE_USD);
  }
  return GENERATE_USD;
}

export function estimateEditCost(): number {
  return roundUsd(EDIT_USD + PER_INPUT_IMAGE_USD);
}

export function createBudgetTracker(options: { limitUsd: number; filePath: string }) {
  const limitUsd = options.limitUsd > 0 ? options.limitUsd : null;
  fs.mkdirSync(path.dirname(options.filePath), { recursive: true });
  let spentUsd = readSpend(options.filePath);

  function snapshot(): BudgetSnapshot {
    return {
      limitUsd,
      spentUsd: roundUsd(spentUsd),
      remainingUsd: limitUsd === null ? null : roundUsd(Math.max(0, limitUsd - spentUsd)),
    };
  }

  function assertCanSpend(costUsd: number): void {
    if (limitUsd === null) return;
    if (spentUsd + costUsd <= limitUsd + 1e-9) return;
    throw new BudgetExceededError(
      `Image budget reached ($${roundUsd(spentUsd).toFixed(2)} / $${limitUsd.toFixed(2)}). Further AI calls are blocked.`,
    );
  }

  function addSpend(costUsd: number): void {
    spentUsd = roundUsd(spentUsd + costUsd);
    fs.writeFileSync(options.filePath, JSON.stringify({ spentUsd } satisfies SpendFile));
  }

  function wrap(provider: ImageProvider): ImageProvider {
    return {
      async generate(input) {
        const cost = estimateGenerateCost(input);
        assertCanSpend(cost);
        const result = await provider.generate(input);
        addSpend(cost);
        return result;
      },
      async edit(input: EditInput) {
        const cost = estimateEditCost();
        assertCanSpend(cost);
        const result = await provider.edit(input);
        addSpend(cost);
        return result;
      },
    };
  }

  return { snapshot, assertCanSpend, addSpend, wrap };
}

function readSpend(filePath: string): number {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as SpendFile;
    return typeof parsed.spentUsd === "number" ? parsed.spentUsd : 0;
  } catch {
    return 0;
  }
}

function roundUsd(value: number): number {
  return Math.round(value * 10000) / 10000;
}
