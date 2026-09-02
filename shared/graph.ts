import type { Preset } from "./preset.ts";

export type { Preset } from "./preset.ts";

export type PortType = "text" | "image";

export type NodeSpec = {
  inputs: PortType[];
  outputs: PortType[];
  label: string;
};

export type NodeType =
  | "prompt"
  | "imageInput"
  | "generateImage"
  | "editImage"
  | "result";

export type JobStatus = "idle" | "queued" | "running" | "success" | "error";

export type RunStatus = "queued" | "running" | "completed" | "failed";

export type GraphNodeData = {
  label?: string;
  text?: string;
  imageUrl?: string;
  presetId?: string;
};

export type GraphNode = {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: GraphNodeData;
};

export type GraphEdge = {
  id: string;
  source: string;
  sourceHandle: PortType;
  target: string;
  targetHandle: PortType;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type JobOutput = {
  text?: string;
  imageUrl?: string;
};

export type BuiltRequest = {
  userPrompt: string;
  presetId?: string | null;
  presetName?: string;
  mainPrompt: string;
  negativePrompt: string;
  references: string[];
  prompt: string;
};

export type Job = {
  nodeId: string;
  status: JobStatus;
  error?: string;
  output?: JobOutput;
  request?: BuiltRequest;
  startedAt?: number;
  finishedAt?: number;
};

export type Run = {
  id: string;
  status: RunStatus;
  graph: Graph;
  presetId?: string | null;
  preset?: Preset | null;
  jobs: Record<string, Job>;
  error?: string;
  createdAt: number;
  updatedAt: number;
};

export type CreateRunRequest = {
  graph: Graph;
  presetId?: string | null;
};

export type CreateRunResponse = {
  runId: string;
};

export type RunSnapshot = {
  id: string;
  status: RunStatus;
  presetId?: string | null;
  preset?: Preset | null;
  jobs: Record<string, Job>;
  error?: string;
  updatedAt: number;
};
