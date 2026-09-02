import type { Edge } from "@xyflow/react";
import type { WorkflowNode } from "@entities/node/model/types";

export type ScenarioId = "generate" | "edit" | "branch";

export type Scenario = {
  id: ScenarioId;
  title: string;
  nodes: WorkflowNode[];
  edges: Edge[];
};
