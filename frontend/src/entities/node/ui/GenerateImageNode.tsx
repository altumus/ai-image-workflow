import type { NodeProps } from "@xyflow/react";
import { useSelectedPreset } from "@entities/preset";
import type { WorkflowNode } from "@entities/node/model/types";
import { NodeShell } from "./NodeShell";

export function GenerateImageNode({ data, selected }: NodeProps<WorkflowNode>) {
  const preset = useSelectedPreset();

  return (
    <NodeShell type="generateImage" title={data.label ?? "Generate Image"} selected={selected}>
      <p className="hint" style={{ margin: 0 }}>
        text → image. Request Builder {preset ? `uses ${preset.name}` : "sends the user prompt as-is"}.
      </p>
      {data.imageUrl && <img className="preview" src={data.imageUrl} alt="generated" />}
    </NodeShell>
  );
}
