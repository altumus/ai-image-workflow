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
