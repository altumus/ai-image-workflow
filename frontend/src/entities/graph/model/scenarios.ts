import type { Edge } from "@xyflow/react";
import type { Scenario } from "./scenario-types";

export const SCENARIOS: Scenario[] = [
  {
    id: "generate",
    title: "1. Generate",
    nodes: [
      {
        id: "prompt-1",
        type: "prompt",
        position: { x: 80, y: 160 },
        data: { label: "Prompt", text: "a premium minimal 3D desk lamp, studio lighting" },
      },
      {
        id: "gen-1",
        type: "generateImage",
        position: { x: 380, y: 150 },
        data: { label: "Generate Image" },
      },
      {
        id: "result-1",
        type: "result",
        position: { x: 680, y: 150 },
        data: { label: "Result" },
      },
    ],
    edges: [
      textEdge("prompt-1", "gen-1"),
      imageEdge("gen-1", "result-1"),
    ],
  },
  {
    id: "edit",
    title: "2. Edit",
    nodes: [
      {
        id: "image-1",
        type: "imageInput",
        position: { x: 60, y: 40 },
        data: { label: "Image Input", imageUrl: "/references/ref-1.jpg" },
      },
      {
        id: "prompt-1",
        type: "prompt",
        position: { x: 60, y: 280 },
        data: { label: "Prompt", text: "turn it into a champagne-gold sculpture on a dark plinth" },
      },
      {
        id: "edit-1",
        type: "editImage",
        position: { x: 380, y: 150 },
        data: { label: "Edit Image" },
      },
      {
        id: "result-1",
        type: "result",
        position: { x: 680, y: 150 },
        data: { label: "Result" },
      },
    ],
    edges: [
      imageEdge("image-1", "edit-1"),
      textEdge("prompt-1", "edit-1"),
      imageEdge("edit-1", "result-1"),
    ],
  },
  {
    id: "branch",
    title: "3. Branch",
    nodes: [
      {
        id: "prompt-1",
        type: "prompt",
        position: { x: 40, y: 180 },
        data: { label: "Prompt", text: "a premium 3D perfume bottle, soft studio light" },
      },
      {
        id: "gen-a",
        type: "generateImage",
        position: { x: 360, y: 40 },
        data: { label: "Generate A" },
      },
      {
        id: "gen-b",
        type: "generateImage",
        position: { x: 360, y: 300 },
        data: { label: "Generate B" },
      },
      {
        id: "result-a",
        type: "result",
        position: { x: 660, y: 40 },
        data: { label: "Result A" },
      },
      {
        id: "result-b",
        type: "result",
        position: { x: 660, y: 300 },
        data: { label: "Result B" },
      },
    ],
    edges: [
      textEdge("prompt-1", "gen-a"),
      textEdge("prompt-1", "gen-b"),
      imageEdge("gen-a", "result-a"),
      imageEdge("gen-b", "result-b"),
    ],
  },
];

function textEdge(source: string, target: string): Edge {
  return {
    id: `${source}-${target}-text`,
    source,
    target,
    sourceHandle: "text",
    targetHandle: "text",
  };
}

function imageEdge(source: string, target: string): Edge {
  return {
    id: `${source}-${target}-image`,
    source,
    target,
    sourceHandle: "image",
    targetHandle: "image",
  };
}

export const DEFAULT_SCENARIO = SCENARIOS[0];
