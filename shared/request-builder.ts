import type { BuiltRequest } from "./graph.ts";
import type { Preset } from "./preset.ts";

export function buildRequest(userPrompt: string, preset?: Preset | null): BuiltRequest {
  const trimmed = userPrompt.trim();

  if (!preset) {
    return {
      userPrompt: trimmed,
      presetId: null,
      mainPrompt: trimmed,
      negativePrompt: "",
      references: [],
      prompt: trimmed,
    };
  }

  return {
    userPrompt: trimmed,
    presetId: preset.id,
    presetName: preset.name,
    mainPrompt: preset.mainPrompt.trim(),
    negativePrompt: preset.negativePrompt.trim(),
    references: [...preset.references],
    prompt: composeFinalPrompt(trimmed, preset),
  };
}

function composeFinalPrompt(userPrompt: string, preset: Preset): string {
  const parts = [preset.mainPrompt.trim()];

  if (userPrompt) {
    parts.push("", "User request:", userPrompt);
  }

  if (preset.negativePrompt.trim()) {
    parts.push("", `Avoid: ${preset.negativePrompt.trim()}`);
  }

  if (preset.references.length > 0) {
    parts.push(
      "",
      "Match the look of the attached reference images: premium minimal 3D, soft studio lighting, restrained palette.",
    );
  }

  return parts.join("\n");
}
