import type { NodeProps } from "@xyflow/react";
import { useSelectedPreset } from "@entities/preset";
import type { WorkflowNode } from "@entities/node/model/types";
import { NodeShell } from "./NodeShell";

export function GenerateImageNode({ data, selected }: NodeProps<WorkflowNode>) {
  const preset = useSelectedPreset();

  return (
    <NodeShell type="generateImage" title={data.label ?? "Generate Image"} selected={selected}>
      <p className="hint" style={{ margin: 0 }}>
        text to image. {preset ? `Uses ${preset.name}.` : "Sends the user prompt as-is."} Preview
        appears on Result.
      </p>
    </NodeShell>
  );
}
