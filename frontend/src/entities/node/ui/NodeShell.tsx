import { Handle, Position, useNodeId } from "@xyflow/react";
import { useState, type MouseEvent, type ReactNode } from "react";
import { NODE_SPECS, type NodeType } from "@workflow/shared/graph";
import { useGraphStore } from "@entities/graph";
import { useRunStore } from "@entities/run/model/store";
import { StatusBadge } from "@shared/ui/StatusBadge";
import { Button } from "@shared/ui/Button";
import { ConfirmDialog } from "@shared/ui/ConfirmDialog";
import { TrashIcon } from "@shared/ui/TrashIcon";
import { retryFailedNode } from "@features/run-graph/model/useRunGraph";

type Props = {
  type: NodeType;
  title: string;
  selected?: boolean;
  children: ReactNode;
};

export function NodeShell({ type, title, selected, children }: Props) {
  const id = useNodeId() ?? "";
  const spec = NODE_SPECS[type];
  const job = useRunStore((state) => state.run?.jobs[id]);
  const deleteNode = useGraphStore((state) => state.deleteNode);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const textTargets = spec.inputs.filter((port) => port === "text").length;
  const imageTargets = spec.inputs.filter((port) => port === "image").length;

  function openConfirm(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setConfirmOpen(true);
  }

  return (
    <article className={`wf-node ${selected ? "selected" : ""}`}>
      {spec.inputs.includes("text") && (
        <Handle
          type="target"
          position={Position.Left}
          id="text"
          data-port="text"
          style={{ top: imageTargets ? "32%" : "50%", background: "var(--port-text)" }}
        />
      )}
      {spec.inputs.includes("image") && (
        <Handle
          type="target"
          position={Position.Left}
          id="image"
          data-port="image"
          style={{ top: textTargets ? "72%" : "50%", background: "var(--port-image)" }}
        />
      )}
      {spec.outputs.includes("text") && (
        <Handle
          type="source"
          position={Position.Right}
          id="text"
          data-port="text"
          style={{ background: "var(--port-text)" }}
        />
      )}
      {spec.outputs.includes("image") && (
        <Handle
          type="source"
          position={Position.Right}
          id="image"
          data-port="image"
          style={{ background: "var(--port-image)" }}
        />
      )}

      <header className="wf-node-head">
        <div className="wf-node-title">{title}</div>
        <div className="wf-node-head-actions">
          <StatusBadge status={job?.status ?? "idle"} />
          <button
            type="button"
            className="icon-btn danger nodrag nopan"
            aria-label={`Delete ${title}`}
            title="Delete node"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={openConfirm}
          >
            <TrashIcon />
          </button>
        </div>
      </header>
      <div className="wf-node-body">
        {children}
        {job?.status === "error" && (
          <>
            <div className="job-error">{job.error}</div>
            <Button variant="danger" onClick={() => void retryFailedNode(id)}>
              Retry node
            </Button>
          </>
        )}
      </div>
      {confirmOpen && (
        <ConfirmDialog
          title="Delete node?"
          message={`Remove “${title}” and its connections from the canvas.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            deleteNode(id);
            setConfirmOpen(false);
          }}
        />
      )}
    </article>
  );
}
