'use client';

import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  addEdge,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Primitive, Position, PrimitiveType } from '../lib/types';
import { CompositionEngine } from '../lib/composition-engine';
import PrimitiveNode from './PrimitiveNode';

interface CompositionCanvasProps {
  compositionEngine: CompositionEngine;
  onSelectPrimitive: (primitive: Primitive | null) => void;
}

// Register custom node types
const nodeTypes = {
  primitiveNode: PrimitiveNode,
};

export default function CompositionCanvas({ compositionEngine, onSelectPrimitive }: CompositionCanvasProps) {
  // Convert primitives to ReactFlow nodes
  const getPrimitivesAsNodes = useCallback((): Node[] => {
    return Object.values(compositionEngine.getComposition().primitives).map(primitive => ({
      id: primitive.id,
      type: 'primitiveNode',
      position: primitive.position,
      data: {
        primitive,
        onSelect: () => onSelectPrimitive(primitive),
      },
    }));
  }, [compositionEngine, onSelectPrimitive]);

  // Convert connections to ReactFlow edges
  const getConnectionsAsEdges = useCallback((): Edge[] => {
    return Object.values(compositionEngine.getComposition().connections).map(connection => ({
      id: connection.id,
      source: connection.sourcePortId.split('-')[0], // Extract primitive ID from port ID
      target: connection.targetPortId.split('-')[0], // Extract primitive ID from port ID
      sourceHandle: connection.sourcePortId,
      targetHandle: connection.targetPortId,
      type: 'default',
      animated: true,
      label: connection.resourceType,
    }));
  }, [compositionEngine]);

  const [nodes, setNodes, onNodesChange] = useNodesState(getPrimitivesAsNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getConnectionsAsEdges());
  
  // Update nodes and edges when composition changes
  useEffect(() => {
    setNodes(getPrimitivesAsNodes());
    setEdges(getConnectionsAsEdges());
  }, [compositionEngine, getPrimitivesAsNodes, getConnectionsAsEdges, setNodes, setEdges]);
  
  // Handle connecting nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.sourceHandle && connection.targetHandle) {
        try {
          const newConnection = compositionEngine.addConnection(
            connection.sourceHandle,
            connection.targetHandle
          );
          
          if (newConnection) {
            // Add the edge to the ReactFlow state
            const edge: Edge = {
              id: newConnection.id,
              source: connection.source || '',
              target: connection.target || '',
              sourceHandle: connection.sourceHandle,
              targetHandle: connection.targetHandle,
              type: 'default',
              animated: true,
              label: newConnection.resourceType,
            };
            
            setEdges(addEdge(edge, edges));
          }
        } catch (error) {
          console.error('Failed to connect nodes:', error);
        }
      }
    },
    [compositionEngine, edges, setEdges]
  );
  
  // Handle node position changes
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      try {
        compositionEngine.updatePrimitivePosition(node.id, node.position as Position);
      } catch (error) {
        console.error('Failed to update node position:', error);
      }
    },
    [compositionEngine]
  );
  
  // Handle node selection
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      try {
        const primitive = compositionEngine.getComposition().primitives[node.id];
        if (primitive) {
          onSelectPrimitive(primitive);
        }
      } catch (error) {
        console.error('Failed to select node:', error);
      }
    },
    [compositionEngine, onSelectPrimitive]
  );
  
  // Handle removing an edge
  const onEdgeDelete = useCallback(
    (edge: Edge) => {
      try {
        compositionEngine.removeConnection(edge.id);
        setEdges(edges => edges.filter(e => e.id !== edge.id));
      } catch (error) {
        console.error('Failed to delete edge:', error);
      }
    },
    [compositionEngine, setEdges]
  );
  
  // Handle removing a node
  const onNodeDelete = useCallback(
    (node: Node) => {
      try {
        compositionEngine.removePrimitive(node.id);
        setNodes(nodes => nodes.filter(n => n.id !== node.id));
        onSelectPrimitive(null);
      } catch (error) {
        console.error('Failed to delete node:', error);
      }
    },
    [compositionEngine, onSelectPrimitive, setNodes]
  );
  
  // Handle keydown events for deletion
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter(node => node.selected);
        const selectedEdges = edges.filter(edge => edge.selected);
        
        selectedNodes.forEach(node => onNodeDelete(node));
        selectedEdges.forEach(edge => onEdgeDelete(edge));
      }
    },
    [nodes, edges, onNodeDelete, onEdgeDelete]
  );
  
  return (
    <ReactFlowProvider>
      <div className="w-full h-full bg-gray-50 rounded-lg shadow" onKeyDown={onKeyDown} tabIndex={0}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.Straight}
          deleteKeyCode="Delete"
          onEdgeDoubleClick={(event, edge) => onEdgeDelete(edge)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          
          <Panel position="top-right" className="bg-white p-2 rounded shadow">
            <button 
              onClick={() => {
                const validationResult = compositionEngine.validateComposition();
                console.log('Validation result:', validationResult);
                alert(validationResult.valid 
                  ? 'Composition is valid!' 
                  : `Validation issues: ${validationResult.issues.map(i => i.message).join(', ')}`
                );
              }}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm mr-2"
            >
              Validate
            </button>
            
            <button 
              onClick={() => {
                const code = compositionEngine.exportCode();
                console.log('Generated code:', code);
                alert('Code generated! Check console for details.');
              }}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              Generate Code
            </button>
          </Panel>
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
} 