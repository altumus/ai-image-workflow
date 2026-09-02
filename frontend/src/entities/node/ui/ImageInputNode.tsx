import type { NodeProps } from "@xyflow/react";
import { useGraphStore } from "@entities/graph";
import type { WorkflowNode } from "@entities/node/model/types";
import { uploadImage } from "@features/upload-image/uploadImage";
import { NodeShell } from "./NodeShell";

export function ImageInputNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const updateNodeData = useGraphStore((state) => state.updateNodeData);

  async function onFile(file?: File) {
    if (!file) return;
    const url = await uploadImage(file);
    updateNodeData(id, { imageUrl: url });
  }

  return (
    <NodeShell type="imageInput" title={data.label ?? "Image Input"} selected={selected}>
      {data.imageUrl ? (
        <img className="preview" src={data.imageUrl} alt="input" />
      ) : (
        <div className="preview empty">No image</div>
      )}
      <label className="btn full file-btn nodrag">
        Upload image
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </label>
    </NodeShell>
  );
}
