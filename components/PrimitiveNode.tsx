'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Primitive } from '../lib/types';

interface PrimitiveNodeData {
  primitive: Primitive;
  onSelect: () => void;
}

const PrimitiveNode = memo(({ data, selected }: NodeProps<PrimitiveNodeData>) => {
  const { primitive, onSelect } = data;
  
  // Define color based on primitive type
  const typeColorMap: Record<string, string> = {
    lendingPool: 'bg-blue-100 border-blue-300 text-blue-800',
    ammPool: 'bg-green-100 border-green-300 text-green-800',
    staking: 'bg-purple-100 border-purple-300 text-purple-800',
    vault: 'bg-amber-100 border-amber-300 text-amber-800',
  };
  
  const typeColor = typeColorMap[primitive.type] || 'bg-gray-100 border-gray-300 text-gray-700';
  
  return (
    <div 
      className={`p-3 rounded-lg border-2 ${selected ? 'ring-2 ring-blue-500' : ''} ${typeColor} min-w-[200px] shadow-md`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div className="text-center font-bold mb-2">{primitive.label || primitive.type}</div>
      
      {/* Input Handles */}
      <div className="mb-4">
        {primitive.inputs && primitive.inputs.map((input, index) => (
          <div key={input.id} className="relative mb-2 last:mb-0">
            <Handle
              id={input.id}
              type="target"
              position={Position.Left}
              className="w-3 h-3 !bg-blue-500"
              style={{ top: `${index * 20 + 10}px` }}
              isConnectable={true}
            />
            <div className="pl-4 text-sm">{input.label}</div>
          </div>
        ))}
        {(!primitive.inputs || primitive.inputs.length === 0) && (
          <div className="text-xs text-gray-500 italic">No inputs</div>
        )}
      </div>
      
      {/* Output Handles */}
      <div>
        {primitive.outputs && primitive.outputs.map((output, index) => (
          <div key={output.id} className="relative mb-2 last:mb-0 text-right">
            <div className="pr-4 text-sm">{output.label}</div>
            <Handle
              id={output.id}
              type="source"
              position={Position.Right}
              className="w-3 h-3 !bg-green-500"
              style={{ top: `${index * 20 + 10}px` }}
              isConnectable={true}
            />
          </div>
        ))}
        {(!primitive.outputs || primitive.outputs.length === 0) && (
          <div className="text-xs text-gray-500 italic">No outputs</div>
        )}
      </div>
      
      {/* Parameters preview */}
      {Object.keys(primitive.parameters || {}).length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs">
          <div className="text-gray-500 mb-1">Parameters:</div>
          {Object.entries(primitive.parameters).slice(0, 2).map(([key, param]) => (
            <div key={key} className="flex justify-between">
              <span>{key}:</span>
              <span className="font-medium">{String(param.value).substring(0, 15)}</span>
            </div>
          ))}
          {Object.keys(primitive.parameters).length > 2 && (
            <div className="text-gray-500 text-right">+{Object.keys(primitive.parameters).length - 2} more</div>
          )}
        </div>
      )}
    </div>
  );
});

PrimitiveNode.displayName = 'PrimitiveNode';

export default PrimitiveNode; 