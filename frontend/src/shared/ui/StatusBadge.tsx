import type { JobStatus, RunStatus } from "@workflow/shared/graph";

export function StatusBadge({ status }: { status: JobStatus | RunStatus | "idle" }) {
  return <span className={`badge ${status}`}>{status}</span>;
}
