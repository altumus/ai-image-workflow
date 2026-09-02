import { api } from "@shared/api/client";
import type { Preset } from "@workflow/shared/preset";
import { usePresetStore } from "../model/store";

export async function updatePreset(id: string, patch: Partial<Omit<Preset, "id">>): Promise<Preset> {
  const { preset } = await api.put<{ preset: Preset }>(`/api/presets/${id}`, patch);
  usePresetStore.getState().upsertPreset(preset);
  return preset;
}
