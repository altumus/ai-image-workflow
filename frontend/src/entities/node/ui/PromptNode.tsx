import type { NodeProps } from "@xyflow/react";
import { useGraphStore } from "@entities/graph";
import type { WorkflowNode } from "@entities/node/model/types";
import { NodeShell } from "./NodeShell";

export function PromptNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const updateNodeData = useGraphStore((state) => state.updateNodeData);
  const text = data.text ?? "";

  return (
    <NodeShell type="prompt" title={data.label ?? "Prompt"} selected={selected}>
      <textarea
        className="wf-textarea wf-textarea-prompt nodrag nowheel"
        value={text}
        placeholder="Describe the image..."
        spellCheck={false}
        onChange={(event) => updateNodeData(id, { text: event.target.value })}
      />
      <div className="field-meta">{text.length} characters · scroll inside the field</div>
    </NodeShell>
  );
}
