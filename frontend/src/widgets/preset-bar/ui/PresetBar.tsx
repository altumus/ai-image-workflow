import { useEffect, useState } from "react";
import { SCENARIOS, useGraphStore } from "@entities/graph";
import { loadPresets, usePresetStore } from "@entities/preset";
import { useRunStore } from "@entities/run/model/store";
import { PresetEditor } from "@features/edit-preset/ui/PresetEditor";
import { useRunGraph } from "@features/run-graph/model/useRunGraph";
import { Button } from "@shared/ui/Button";
import { StatusBadge } from "@shared/ui/StatusBadge";

export type MobilePanel = "palette" | "jobs";

type Props = {
  mobilePanel?: MobilePanel | null;
  onTogglePanel?: (panel: MobilePanel) => void;
};

export function PresetBar({ mobilePanel = null, onTogglePanel }: Props) {
  const presets = usePresetStore((state) => state.presets);
  const selectedId = usePresetStore((state) => state.selectedId);
  const setGraph = useGraphStore((state) => state.setGraph);
  const { start, busy, run } = useRunGraph();
  const [editorOpen, setEditorOpen] = useState(false);

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
        <Button
          variant="ghost"
          disabled={!selectedId}
          onClick={() => setEditorOpen(true)}
        >
          Edit preset
        </Button>
      </div>
      <div className="topbar-end">
        {onTogglePanel && (
          <div className="topbar-toggles">
            <Button
              variant="ghost"
              aria-controls="nodes-panel"
              aria-expanded={mobilePanel === "palette"}
              aria-pressed={mobilePanel === "palette"}
              onClick={() => onTogglePanel("palette")}
            >
              Nodes
            </Button>
            <Button
              variant="ghost"
              aria-controls="jobs-panel"
              aria-expanded={mobilePanel === "jobs"}
              aria-pressed={mobilePanel === "jobs"}
              onClick={() => onTogglePanel("jobs")}
            >
              Jobs
            </Button>
          </div>
        )}
        <Button variant="primary" disabled={busy} onClick={() => void start()}>
          {busy ? "Running…" : "Run graph"}
        </Button>
        {run && <StatusBadge status={run.status} />}
      </div>
      {editorOpen && selectedId && <PresetEditor onClose={() => setEditorOpen(false)} />}
    </header>
  );
}
