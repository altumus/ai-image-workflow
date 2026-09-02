import { useEffect } from "react";
import { SCENARIOS, useGraphStore } from "@entities/graph";
import { loadPresets, usePresetStore } from "@entities/preset";
import { useRunStore } from "@entities/run/model/store";
import { useRunGraph } from "@features/run-graph/model/useRunGraph";
import { Button } from "@shared/ui/Button";
import { StatusBadge } from "@shared/ui/StatusBadge";

export function PresetBar() {
  const presets = usePresetStore((state) => state.presets);
  const selectedId = usePresetStore((state) => state.selectedId);
  const setGraph = useGraphStore((state) => state.setGraph);
  const { start, busy, run } = useRunGraph();

  useEffect(() => {
    void loadPresets().catch(() => undefined);
  }, []);

  return (
    <header className="topbar">
      <div className="brand">
        <strong>AI Image Workflow Mini</strong>
        <span>Graph runner · typed ports · parallel branches</span>
      </div>
      <div className="topbar-actions">
        {SCENARIOS.map((scenario) => (
          <Button
            key={scenario.id}
            variant="ghost"
            onClick={() => {
              setGraph(scenario.nodes, scenario.edges);
              useRunStore.getState().setRun(null);
              useRunStore.getState().setLocalError(null);
            }}
          >
            {scenario.title}
          </Button>
        ))}
        <select
          className="select"
          value={selectedId ?? ""}
          onChange={(event) =>
            usePresetStore.getState().select(event.target.value || null)
          }
        >
          <option value="">No preset</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        <Button variant="primary" disabled={busy} onClick={() => void start()}>
          {busy ? "Running…" : "Run graph"}
        </Button>
        {run && <StatusBadge status={run.status} />}
      </div>
    </header>
  );
}
