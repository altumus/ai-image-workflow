import type { NodeProps } from "@xyflow/react";
import { useGraphStore } from "@entities/graph";
import type { WorkflowNode } from "@entities/node/model/types";
import { NodeShell } from "./NodeShell";

export function PromptNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const updateNodeData = useGraphStore((state) => state.updateNodeData);

  return (
    <NodeShell type="prompt" title={data.label ?? "Prompt"} selected={selected}>
      <textarea
        className="wf-textarea nodrag nowheel"
        value={data.text ?? ""}
        placeholder="Describe the image..."
        onChange={(event) => updateNodeData(id, { text: event.target.value })}
      />
    </NodeShell>
  );
}
