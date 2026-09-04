import { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { NodePalette } from "@widgets/node-palette/ui/NodePalette";
import { PresetBar, type MobilePanel } from "@widgets/preset-bar/ui/PresetBar";
import { RunPanel } from "@widgets/run-panel/ui/RunPanel";
import { WorkflowCanvas } from "@widgets/workflow-canvas/ui/WorkflowCanvas";
import { useMediaQuery } from "@shared/lib/useMediaQuery";

export function WorkflowEditorPage() {
  const isDesktop = useMediaQuery("(min-width: 1100px)");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel | null>(null);

  useEffect(() => {
    if (isDesktop) setMobilePanel(null);
  }, [isDesktop]);

  useEffect(() => {
    if (!mobilePanel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobilePanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobilePanel]);

  function togglePanel(panel: MobilePanel) {
    setMobilePanel((current) => (current === panel ? null : panel));
  }

  return (
    <div className="app-shell">
      <PresetBar mobilePanel={mobilePanel} onTogglePanel={togglePanel} />
      <div className="workspace">
        <NodePalette
          open={isDesktop || mobilePanel === "palette"}
          onClose={isDesktop ? undefined : () => setMobilePanel(null)}
        />
        <ReactFlowProvider>
          <WorkflowCanvas />
        </ReactFlowProvider>
        <RunPanel
          open={isDesktop || mobilePanel === "jobs"}
          onClose={isDesktop ? undefined : () => setMobilePanel(null)}
        />
        {!isDesktop && mobilePanel && (
          <button
            type="button"
            className="workspace-backdrop"
            aria-label="Close panel"
            onClick={() => setMobilePanel(null)}
          />
        )}
      </div>
    </div>
  );
}
