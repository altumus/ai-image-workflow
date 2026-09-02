import { ReactFlowProvider } from "@xyflow/react";
import { NodePalette } from "@widgets/node-palette/ui/NodePalette";
import { PresetBar } from "@widgets/preset-bar/ui/PresetBar";
import { RunPanel } from "@widgets/run-panel/ui/RunPanel";
import { WorkflowCanvas } from "@widgets/workflow-canvas/ui/WorkflowCanvas";

export function WorkflowEditorPage() {
  return (
    <div className="app-shell">
      <PresetBar />
      <div className="workspace">
        <NodePalette />
        <ReactFlowProvider>
          <WorkflowCanvas />
        </ReactFlowProvider>
        <RunPanel />
      </div>
    </div>
  );
}
