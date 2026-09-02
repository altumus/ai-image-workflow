import { Background, Controls, ReactFlow, type Connection, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraphStore } from "@entities/graph";
import { nodeTypes } from "@entities/node/model/nodeTypes";
import { canConnect } from "@features/edit-graph/model/connection";

export function WorkflowCanvas() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const onNodesChange = useGraphStore((state) => state.onNodesChange);
  const onEdgesChange = useGraphStore((state) => state.onEdgesChange);
  const onConnect = useGraphStore((state) => state.onConnect);

  const isValidConnection = (connection: Connection | Edge) =>
    canConnect(connection, edges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      isValidConnection={isValidConnection}
      nodeTypes={nodeTypes}
      fitView
      colorMode="dark"
      deleteKeyCode={["Backspace", "Delete"]}
    >
      <Background gap={22} color="#1d2733" />
      <Controls />
    </ReactFlow>
  );
}
