import type { NodeProps } from "@xyflow/react";
import { useGraphStore } from "@entities/graph";
import type { WorkflowNode } from "@entities/node/model/types";
import { NodeShell } from "./NodeShell";

export function EditImageNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const updateNodeData = useGraphStore((state) => state.updateNodeData);

  return (
    <NodeShell type="editImage" title={data.label ?? "Edit Image"} selected={selected}>
      <p className="hint" style={{ margin: 0 }}>
        Needs image + text. Fallback prompt:
      </p>
      <textarea
        className="wf-textarea nodrag nowheel"
        value={data.text ?? ""}
        placeholder="Optional local prompt"
        onChange={(event) => updateNodeData(id, { text: event.target.value })}
      />
      {data.imageUrl && <img className="preview" src={data.imageUrl} alt="edited" />}
    </NodeShell>
  );
}
