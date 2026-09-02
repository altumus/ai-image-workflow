import { create } from "zustand";
import type { Preset } from "@workflow/shared/preset";

type PresetState = {
  presets: Preset[];
  selectedId: string | null;
  setPresets: (presets: Preset[]) => void;
  select: (id: string | null) => void;
};

export const usePresetStore = create<PresetState>((set) => ({
  presets: [],
  selectedId: "preset-demo",
  setPresets: (presets) => set({ presets }),
  select: (selectedId) => set({ selectedId }),
}));
