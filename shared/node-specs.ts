import type { NodeSpec, NodeType } from "./graph.ts";

export const NODE_SPECS: Record<NodeType, NodeSpec> = {
  prompt: { inputs: [], outputs: ["text"], label: "Prompt" },
  imageInput: { inputs: [], outputs: ["image"], label: "Image Input" },
  generateImage: { inputs: ["text"], outputs: ["image"], label: "Generate Image" },
  editImage: { inputs: ["image", "text"], outputs: ["image"], label: "Edit Image" },
  result: { inputs: ["image"], outputs: [], label: "Result" },
};
