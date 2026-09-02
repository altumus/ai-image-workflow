import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import type { Job, NodeType } from "@workflow/shared/graph";
import type { WorkflowNode } from "@entities/node/model/types";
import { DEFAULT_SCENARIO } from "./scenarios";

type GraphState = {
  nodes: WorkflowNode[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setGraph: (nodes: WorkflowNode[], edges: Edge[]) => void;
  addNode: (type: NodeType) => void;
  updateNodeData: (id: string, data: WorkflowNode["data"]) => void;
  patchOutputs: (jobs: Record<string, Job>) => void;
  deleteNode: (id: string) => void;
  deleteSelected: () => void;
};

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: DEFAULT_SCENARIO.nodes,
  edges: DEFAULT_SCENARIO.edges,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          id: `${connection.source}-${connection.target}-${connection.sourceHandle}`,
        },
        get().edges,
      ),
    });
  },
  setGraph: (nodes, edges) => set({ nodes, edges }),
  addNode: (type) => {
    const id = `${type}-${crypto.randomUUID().slice(0, 8)}`;
    const offset = get().nodes.length * 28;
    const node: WorkflowNode = {
      id,
      type,
      position: { x: 120 + offset, y: 80 + offset },
      data: {
        label: labelFor(type),
        text: type === "prompt" || type === "editImage" ? "" : undefined,
      },
    };
    set({ nodes: [...get().nodes, node] });
  },
  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
      ),
    });
  },
  patchOutputs: (jobs) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.type !== "result") return node;
        const imageUrl = jobs[node.id]?.output?.imageUrl;
        if (!imageUrl) return node;
        return { ...node, data: { ...node.data, imageUrl } };
      }),
    });
  },
  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
    });
  },
  deleteSelected: () => {
    const selected = new Set(get().nodes.filter((node) => node.selected).map((node) => node.id));
    set({
      nodes: get().nodes.filter((node) => !node.selected),
      edges: get().edges.filter(
        (edge) => !edge.selected && !selected.has(edge.source) && !selected.has(edge.target),
      ),
    });
  },
}));

function labelFor(type: NodeType): string {
  if (type === "prompt") return "Prompt";
  if (type === "imageInput") return "Image Input";
  if (type === "generateImage") return "Generate Image";
  if (type === "editImage") return "Edit Image";
  return "Result";
}
