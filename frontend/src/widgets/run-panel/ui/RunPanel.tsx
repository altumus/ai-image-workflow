import { useGraphStore } from "@entities/graph";
import { RequestPreview } from "@features/select-preset/ui/RequestPreview";
import { useRunGraph } from "@features/run-graph/model/useRunGraph";
import { Button } from "@shared/ui/Button";
import { StatusBadge } from "@shared/ui/StatusBadge";

type Props = {
  open?: boolean;
  onClose?: () => void;
};

export function RunPanel({ open = true, onClose }: Props) {
  const nodes = useGraphStore((state) => state.nodes);
  const { run, localError, retry } = useRunGraph();
  const jobs = run?.jobs ?? {};

  return (
    <aside
      id="jobs-panel"
      className={`run-panel ${open ? "is-open" : ""}`}
      aria-hidden={!open}
      inert={!open || undefined}
    >
      <div className="panel-head panel-head-mobile">
        {onClose && (
          <button
            type="button"
            className="icon-btn panel-close"
            aria-label="Close jobs panel"
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>
      <RequestPreview />
      <div className="section-label">Jobs</div>
      {run && (
        <div style={{ marginBottom: 12 }}>
          Run <StatusBadge status={run.status} />
        </div>
      )}
      {localError && <p className="local-error">{localError}</p>}
      <div className="job-list">
        {nodes.map((node) => {
          const job = jobs[node.id];
          return (
            <div className="job-row" key={node.id}>
              <header>
                <strong>{node.data.label ?? node.type}</strong>
                <StatusBadge status={job?.status ?? "idle"} />
              </header>
              {job?.request?.presetName && (
                <p className="hint" style={{ margin: "0 0 6px" }}>
                  via {job.request.presetName}
                </p>
              )}
              {job?.error && <div className="job-error">{job.error}</div>}
              {job?.status === "error" && (
                <Button variant="danger" onClick={() => void retry(node.id)}>
                  Retry
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
