import type { Run } from "../../../shared/graph.ts";

const runs = new Map<string, Run>();
const executing = new Set<string>();

export const runStore = {
  get(id: string): Run | undefined {
    return runs.get(id);
  },
  set(run: Run): void {
    runs.set(run.id, run);
  },
  isExecuting(id: string): boolean {
    return executing.has(id);
  },
  markExecuting(id: string): void {
    executing.add(id);
  },
  markIdle(id: string): void {
    executing.delete(id);
  },
  clear(): void {
    runs.clear();
    executing.clear();
  },
};
