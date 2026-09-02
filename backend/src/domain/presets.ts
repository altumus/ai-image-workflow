import { MAX_PRESET_REFERENCES } from "../../../shared/preset-constants.ts";
import type { Preset, PresetPatch } from "../../../shared/preset.ts";
import { PRESETS } from "./preset-catalog.ts";

export { PRESETS } from "./preset-catalog.ts";

export function getPreset(id?: string | null): Preset | undefined {
  if (!id) return undefined;
  return PRESETS.find((preset) => preset.id === id);
}

export function requirePreset(
  id?: string | null,
): { ok: true; preset: Preset | null } | { ok: false; error: string } {
  if (!id) return { ok: true, preset: null };
  const preset = getPreset(id);
  if (!preset) return { ok: false, error: `Unknown preset: ${id}` };
  return { ok: true, preset };
}

export function updatePreset(id: string, patch: PresetPatch): Preset {
  const preset = getPreset(id);
  if (!preset) {
    throw new Error(`Unknown preset: ${id}`);
  }
  if (typeof patch.name === "string") {
    const name = patch.name.trim();
    if (!name) throw new Error("Preset name is required");
    preset.name = name;
  }
  if (typeof patch.mainPrompt === "string") {
    preset.mainPrompt = patch.mainPrompt.trim();
  }
  if (typeof patch.negativePrompt === "string") {
    preset.negativePrompt = patch.negativePrompt.trim();
  }
  if (patch.references) {
    if (patch.references.length > MAX_PRESET_REFERENCES) {
      throw new Error(`At most ${MAX_PRESET_REFERENCES} references`);
    }
    for (const url of patch.references) {
      if (!isAllowedReference(url)) {
        throw new Error(`Invalid reference: ${url}`);
      }
    }
    preset.references = [...patch.references];
  }
  return preset;
}

export function isAllowedReference(url: string): boolean {
  return url.startsWith("/uploads/") || url.startsWith("/references/");
}
