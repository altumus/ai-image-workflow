import type { NodeProps } from "@xyflow/react";
import type { WorkflowNode } from "@entities/node/model/types";
import { useRunStore } from "@entities/run/model/store";
import { downloadImage } from "@shared/lib/downloadImage";
import { Button } from "@shared/ui/Button";
import { NodeShell } from "./NodeShell";

export function ResultNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const job = useRunStore((state) => state.run?.jobs[id]);
  const imageUrl = job?.output?.imageUrl ?? data.imageUrl;
  const loading = job?.status === "queued" || job?.status === "running";
  const title = data.label ?? "Result";

  return (
    <NodeShell type="result" title={title} selected={selected}>
      {imageUrl ? (
        <>
          <img className="preview" src={imageUrl} alt={title} />
          <Button
            className="full nodrag"
            onClick={() => downloadImage(imageUrl, `${title.replace(/\s+/g, "-").toLowerCase()}`)}
          >
            Download
          </Button>
        </>
      ) : (
        <div className="preview empty">{loading ? "Generating…" : "Waiting for image"}</div>
      )}
    </NodeShell>
  );
}
