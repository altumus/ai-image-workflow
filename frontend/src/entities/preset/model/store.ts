import { create } from "zustand";
import type { Preset } from "@workflow/shared/preset";

type PresetState = {
  presets: Preset[];
  selectedId: string | null;
  setPresets: (presets: Preset[]) => void;
  upsertPreset: (preset: Preset) => void;
  select: (id: string | null) => void;
};

export const usePresetStore = create<PresetState>((set, get) => ({
  presets: [],
  selectedId: "preset-demo",
  setPresets: (presets) => set({ presets }),
  upsertPreset: (preset) => {
    const current = get().presets;
    const exists = current.some((item) => item.id === preset.id);
    set({
      presets: exists
        ? current.map((item) => (item.id === preset.id ? preset : item))
        : [...current, preset],
    });
  },
  select: (selectedId) => set({ selectedId }),
}));
