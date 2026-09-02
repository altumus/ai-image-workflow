import type { Graph, GraphEdge, GraphNode, Job, Run } from "../../../shared/graph.ts";

export function incomingEdges(graph: Graph, nodeId: string): GraphEdge[] {
  return graph.edges.filter((edge) => edge.target === nodeId);
}

export function outgoingTargets(graph: Graph, nodeId: string): string[] {
  return graph.edges.filter((edge) => edge.source === nodeId).map((edge) => edge.target);
}

export function collectDescendants(graph: Graph, rootId: string): string[] {
  const seen = new Set<string>();
  const stack = [...outgoingTargets(graph, rootId)];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...outgoingTargets(graph, id));
  }
  return [...seen];
}

export function getTextInput(node: GraphNode, run: Run): string | undefined {
  const edge = incomingEdges(run.graph, node.id).find((item) => item.targetHandle === "text");
  if (edge) return run.jobs[edge.source]?.output?.text;
  return node.data.text;
}

export function getImageInput(node: GraphNode, run: Run): string | undefined {
  const edge = incomingEdges(run.graph, node.id).find((item) => item.targetHandle === "image");
  if (edge) return run.jobs[edge.source]?.output?.imageUrl;
  return node.data.imageUrl;
}

export function resetSubtree(run: Run, nodeId: string): void {
  const ids = [nodeId, ...collectDescendants(run.graph, nodeId)];
  for (const id of ids) {
    run.jobs[id] = { nodeId: id, status: "idle" };
  }
}

export function snapshotJobs(run: Run): Record<string, Job> {
  return structuredClone(run.jobs);
}
