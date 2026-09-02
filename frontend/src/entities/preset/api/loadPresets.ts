import { api } from "@shared/api/client";
import type { Preset } from "@workflow/shared/preset";
import { usePresetStore } from "../model/store";

export async function loadPresets(): Promise<void> {
  const { presets } = await api.get<{ presets: Preset[] }>("/api/presets");
  usePresetStore.getState().setPresets(presets);
}
