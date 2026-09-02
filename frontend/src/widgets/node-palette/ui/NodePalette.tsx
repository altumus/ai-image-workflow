import type { NodeType } from "@workflow/shared/graph";
import { NODE_SPECS } from "@workflow/shared/node-specs";
import { useGraphStore } from "@entities/graph";
import { Button } from "@shared/ui/Button";

const TYPES = Object.keys(NODE_SPECS) as NodeType[];

export function NodePalette() {
  const addNode = useGraphStore((state) => state.addNode);
  const deleteSelected = useGraphStore((state) => state.deleteSelected);

  return (
    <aside className="palette">
      <div className="section-label">Nodes</div>
      <div className="palette-list">
        {TYPES.map((type) => (
          <Button key={type} className="full" onClick={() => addNode(type)}>
            {NODE_SPECS[type].label}
          </Button>
        ))}
        <Button variant="ghost" className="full" onClick={deleteSelected}>
          Delete selected
        </Button>
      </div>
      <p className="hint">
        Blue handles are text, orange handles are image. The red trash on a node deletes it
        after confirmation. Independent branches run in parallel.
      </p>
    </aside>
  );
}
