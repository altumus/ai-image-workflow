import type { Edge } from "@xyflow/react";
import type { Graph, PortType } from "@workflow/shared/graph";
import type { WorkflowNode } from "@entities/node/model/types";

export function toApiGraph(nodes: WorkflowNode[], edges: Edge[]): Graph {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type!,
      position: node.position,
      data: {
        label: node.data.label,
        text: node.data.text,
        imageUrl: node.data.imageUrl,
        presetId: node.data.presetId,
      },
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: (edge.sourceHandle ?? "text") as PortType,
      target: edge.target,
      targetHandle: (edge.targetHandle ?? "text") as PortType,
    })),
  };
}
