import type { Preset } from "../../../shared/preset.ts";

export const PRESETS: Preset[] = [
  {
    id: "preset-demo",
    name: "Premium 3D",
    mainPrompt:
      "premium minimal 3D visual, soft studio lighting, restrained champagne-gold and warm-gray palette, photoreal product visualization, clean composition, no clutter",
    negativePrompt: "clutter, noisy background, watermark, extra text, extra logos, cartoon outlines",
    references: ["/references/ref-1.jpg", "/references/ref-2.jpg"],
  },
];

export function getPreset(id?: string | null): Preset | undefined {
  if (!id) return undefined;
  return PRESETS.find((preset) => preset.id === id);
}

export function requirePreset(id?: string | null): { ok: true; preset: Preset | null } | { ok: false; error: string } {
  if (!id) return { ok: true, preset: null };
  const preset = getPreset(id);
  if (!preset) return { ok: false, error: `Unknown preset: ${id}` };
  return { ok: true, preset };
}
