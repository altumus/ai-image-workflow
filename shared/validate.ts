import type { Graph, GraphEdge, NodeType, PortType } from "./graph.ts";
import { NODE_SPECS } from "./node-specs.ts";

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateGraph(graph: Graph): ValidationResult {
  if (!graph?.nodes?.length) {
    return { ok: false, error: "Graph is empty" };
  }

  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (!node.id) return { ok: false, error: "Node is missing id" };
    if (ids.has(node.id)) {
      return { ok: false, error: `Duplicate node id: ${node.id}` };
    }
    ids.add(node.id);
    if (!NODE_SPECS[node.type as NodeType]) {
      return { ok: false, error: `Unknown node type: ${String(node.type)}` };
    }
  }

  for (const edge of graph.edges ?? []) {
    const edgeCheck = validateEdge(graph, edge);
    if (!edgeCheck.ok) return edgeCheck;
  }

  const occupied = new Set<string>();
  for (const edge of graph.edges ?? []) {
    const key = `${edge.target}:${edge.targetHandle}`;
    if (occupied.has(key)) {
      return { ok: false, error: `Multiple connections into ${key}` };
    }
    occupied.add(key);
  }

  if (hasCycle(graph)) {
    return { ok: false, error: "Graph contains a cycle" };
  }

  for (const node of graph.nodes) {
    const incoming = (graph.edges ?? []).filter((edge) => edge.target === node.id);
    const hasTextEdge = incoming.some((edge) => edge.targetHandle === "text");
    const hasImageEdge = incoming.some((edge) => edge.targetHandle === "image");

    if (node.type === "prompt" && !node.data.text?.trim()) {
      return { ok: false, error: `Prompt node "${node.data.label ?? node.id}" is empty` };
    }
    if (node.type === "imageInput" && !node.data.imageUrl) {
      return { ok: false, error: `Image Input "${node.data.label ?? node.id}" has no image` };
    }
    if (node.type === "generateImage") {
      const hasText = hasTextEdge || Boolean(node.data.text?.trim());
      if (!hasText) {
        return {
          ok: false,
          error: `Generate Image "${node.data.label ?? node.id}" needs a text input`,
        };
      }
    }
    if (node.type === "editImage") {
      if (!hasImageEdge) {
        return {
          ok: false,
          error: `Edit Image "${node.data.label ?? node.id}" needs an image input`,
        };
      }
      const hasText = hasTextEdge || Boolean(node.data.text?.trim());
      if (!hasText) {
        return {
          ok: false,
          error: `Edit Image "${node.data.label ?? node.id}" needs a text prompt`,
        };
      }
    }
    if (node.type === "result" && !hasImageEdge) {
      return {
        ok: false,
        error: `Result "${node.data.label ?? node.id}" needs an image input`,
      };
    }
  }

  return { ok: true };
}

export function validateEdge(graph: Graph, edge: GraphEdge): ValidationResult {
  if (edge.sourceHandle !== edge.targetHandle) {
    return {
      ok: false,
      error: `Incompatible ports: ${edge.sourceHandle} → ${edge.targetHandle}`,
    };
  }
  if (edge.source === edge.target) {
    return { ok: false, error: "Self-loop is not allowed" };
  }

  const source = graph.nodes.find((node) => node.id === edge.source);
  const target = graph.nodes.find((node) => node.id === edge.target);
  if (!source || !target) {
    return { ok: false, error: "Edge references a missing node" };
  }

  const sourceSpec = NODE_SPECS[source.type];
  const targetSpec = NODE_SPECS[target.type];
  if (!sourceSpec.outputs.includes(edge.sourceHandle)) {
    return {
      ok: false,
      error: `${sourceSpec.label} has no ${edge.sourceHandle} output`,
    };
  }
  if (!targetSpec.inputs.includes(edge.targetHandle)) {
    return {
      ok: false,
      error: `${targetSpec.label} has no ${edge.targetHandle} input`,
    };
  }
  return { ok: true };
}

export function hasCycle(graph: Graph): boolean {
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of graph.nodes) {
    indegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }
  for (const edge of graph.edges ?? []) {
    if (!indegree.has(edge.source) || !indegree.has(edge.target)) continue;
    adjacency.get(edge.source)!.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  const queue = [...indegree.entries()]
    .filter(([, value]) => value === 0)
    .map(([id]) => id);
  let seen = 0;

  while (queue.length > 0) {
    const id = queue.shift()!;
    seen += 1;
    for (const next of adjacency.get(id) ?? []) {
      const nextDegree = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, nextDegree);
      if (nextDegree === 0) queue.push(next);
    }
  }

  return seen !== graph.nodes.length;
}

export function wouldCreateCycle(
  edges: GraphEdge[],
  source: string,
  target: string,
): boolean {
  if (source === target) return true;
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adjacency.get(edge.source) ?? [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
  }
  const extra = adjacency.get(source) ?? [];
  extra.push(target);
  adjacency.set(source, extra);

  const stack = [target];
  const visited = new Set<string>();
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === source) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) stack.push(next);
  }
  return false;
}

export function isCompatiblePorts(
  sourceHandle?: string | null,
  targetHandle?: string | null,
): boolean {
  if (!sourceHandle || !targetHandle) return false;
  return sourceHandle === targetHandle && isPortType(sourceHandle);
}

function isPortType(value: string): value is PortType {
  return value === "text" || value === "image";
}
