import type { NodeTypes } from "@xyflow/react";
import { EditImageNode } from "../ui/EditImageNode";
import { GenerateImageNode } from "../ui/GenerateImageNode";
import { ImageInputNode } from "../ui/ImageInputNode";
import { PromptNode } from "../ui/PromptNode";
import { ResultNode } from "../ui/ResultNode";

export const nodeTypes = {
  prompt: PromptNode,
  imageInput: ImageInputNode,
  generateImage: GenerateImageNode,
  editImage: EditImageNode,
  result: ResultNode,
} satisfies NodeTypes;
