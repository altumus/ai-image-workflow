import { buildRequest } from "../../../shared/request-builder.ts";
import type { Preset } from "../../../shared/graph.ts";

/** @deprecated use buildRequest — kept as a thin wrapper for older imports */
export function composePrompt(userPrompt: string, preset?: Preset | null): string {
  return buildRequest(userPrompt, preset).prompt;
}
