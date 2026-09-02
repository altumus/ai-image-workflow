import type { NodeProps } from "@xyflow/react";
import type { WorkflowNode } from "@entities/node/model/types";
import { useRunStore } from "@entities/run/model/store";
import { NodeShell } from "./NodeShell";

export function ResultNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const job = useRunStore((state) => state.run?.jobs[id]);
  const imageUrl = job?.output?.imageUrl ?? data.imageUrl;
  const loading = job?.status === "queued" || job?.status === "running";

  return (
    <NodeShell type="result" title={data.label ?? "Result"} selected={selected}>
      {imageUrl ? (
        <img className="preview" src={imageUrl} alt="result" />
      ) : (
        <div className="preview empty">{loading ? "Generating…" : "Waiting for image"}</div>
      )}
    </NodeShell>
  );
}
