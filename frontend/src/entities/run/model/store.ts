import { create } from "zustand";
import type { RunSnapshot } from "@workflow/shared/graph";

type RunState = {
  run: RunSnapshot | null;
  localError: string | null;
  setRun: (run: RunSnapshot | null) => void;
  setLocalError: (error: string | null) => void;
};

export const useRunStore = create<RunState>((set) => ({
  run: null,
  localError: null,
  setRun: (run) => set({ run }),
  setLocalError: (localError) => set({ localError }),
}));
