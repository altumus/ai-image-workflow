import { usePresetStore } from "./store";
import type { Preset } from "@workflow/shared/preset";

export function useSelectedPreset(): Preset | null {
  return usePresetStore((state) => {
    if (!state.selectedId) return null;
    return state.presets.find((preset) => preset.id === state.selectedId) ?? null;
  });
}

export function getSelectedPresetId(): string | null {
  return usePresetStore.getState().selectedId;
}
