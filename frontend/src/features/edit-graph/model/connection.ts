import type { Connection, Edge } from "@xyflow/react";
import type { GraphEdge } from "@workflow/shared/graph";
import { isCompatiblePorts, wouldCreateCycle } from "@workflow/shared/validate";

export function canConnect(connection: Connection | Edge, edges: Edge[]): boolean {
  if (!connection.source || !connection.target) return false;
  if (connection.source === connection.target) return false;
  if (!isCompatiblePorts(connection.sourceHandle, connection.targetHandle)) return false;

  const occupied = edges.some(
    (edge) =>
      edge.target === connection.target && edge.targetHandle === connection.targetHandle,
  );
  if (occupied) return false;

  return !wouldCreateCycle(
    edges as GraphEdge[],
    connection.source,
    connection.target,
  );
}
