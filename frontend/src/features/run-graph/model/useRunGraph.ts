import { useGraphStore } from "@entities/graph";
import { getSelectedPresetId } from "@entities/preset";
import { useRunStore } from "@entities/run/model/store";
import { toApiGraph } from "@features/edit-graph/model/toApiGraph";
import { api, ApiError } from "@shared/api/client";
import type { CreateRunResponse, RunSnapshot } from "@workflow/shared/graph";
import { validateGraph } from "@workflow/shared/validate";

const POLL_MS = 500;
let timer: number | null = null;

function stopPolling() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
}

async function poll(runId: string) {
  const snapshot = await api.get<RunSnapshot>(`/api/runs/${runId}`);
  useRunStore.getState().setRun(snapshot);
  useGraphStore.getState().patchOutputs(snapshot.jobs);
  if (snapshot.status === "completed" || snapshot.status === "failed") {
    stopPolling();
  }
}

function startPolling(runId: string) {
  stopPolling();
  void poll(runId);
  timer = window.setInterval(() => {
    void poll(runId);
  }, POLL_MS);
}

export async function retryFailedNode(nodeId: string) {
  const runId = useRunStore.getState().run?.id;
  if (!runId) return;
  try {
    await api.post(`/api/runs/${runId}/nodes/${nodeId}/retry`);
    startPolling(runId);
  } catch (error) {
    useRunStore.getState().setLocalError(error instanceof ApiError ? error.message : "Retry failed");
  }
}

export function useRunGraph() {
  const run = useRunStore((state) => state.run);
  const localError = useRunStore((state) => state.localError);
  const busy = run?.status === "queued" || run?.status === "running";

  async function start() {
    const { nodes, edges } = useGraphStore.getState();
    const graph = toApiGraph(nodes, edges);
    const validation = validateGraph(graph);
    if (!validation.ok) {
      useRunStore.getState().setLocalError(validation.error);
      return;
    }

    useRunStore.getState().setLocalError(null);
    try {
      const { runId } = await api.post<CreateRunResponse>("/api/runs", {
        graph,
        presetId: getSelectedPresetId(),
      });
      startPolling(runId);
    } catch (error) {
      useRunStore.getState().setLocalError(error instanceof ApiError ? error.message : "Run failed");
    }
  }

  return { start, retry: retryFailedNode, busy, run, localError };
}
