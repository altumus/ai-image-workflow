import { describe, expect, it } from "vitest";
import { buildRequest } from "../../../shared/request-builder.ts";
import { PRESETS } from "./presets.ts";

const preset = PRESETS[0];

describe("Request Builder", () => {
  it("passes the user prompt through when no preset is selected", () => {
    const request = buildRequest("a red cube");
    expect(request.prompt).toBe("a red cube");
    expect(request.mainPrompt).toBe("a red cube");
    expect(request.negativePrompt).toBe("");
    expect(request.references).toEqual([]);
    expect(request.presetId).toBeNull();
  });

  it("merges user prompt with preset mainPrompt, negativePrompt and references", () => {
    const request = buildRequest("a perfume bottle", preset);
    expect(request.presetId).toBe("preset-demo");
    expect(request.presetName).toBe("Premium 3D");
    expect(request.userPrompt).toBe("a perfume bottle");
    expect(request.mainPrompt).toContain("premium minimal 3D");
    expect(request.negativePrompt).toContain("clutter");
    expect(request.references).toEqual(["/references/ref-1.jpg", "/references/ref-2.jpg"]);
    expect(request.prompt).toContain(request.mainPrompt);
    expect(request.prompt).toContain("User request:");
    expect(request.prompt).toContain("a perfume bottle");
    expect(request.prompt).toContain(`Avoid: ${request.negativePrompt}`);
  });
});
