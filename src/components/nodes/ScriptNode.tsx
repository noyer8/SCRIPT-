import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import {
  Play,
  FileText,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  GitBranch,
  Zap,
  Square,
  PhoneForwarded,
  Clock,
} from 'lucide-react';
import type { ScriptNodeData } from '../../types';
import { NODE_TYPE_CONFIG } from '../../types';
import { useStore } from '../../store/useStore';

const iconMap = {
  Play,
  FileText,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  GitBranch,
  Zap,
  Square,
  PhoneForwarded,
  Clock,
};

function ScriptNode({ id, data, selected }: NodeProps) {
  const { player } = useStore();
  const nodeData = data as ScriptNodeData;
  const config = NODE_TYPE_CONFIG[nodeData.type];
  const IconComponent = iconMap[config.icon as keyof typeof iconMap];
  const isCurrentInPlayer = player.isActive && player.currentNodeId === id;

  return (
    <div
      className={`
        min-w-[200px] rounded-lg shadow-md border-2 transition-all
        ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
        ${isCurrentInPlayer ? 'ring-4 ring-green-400 ring-offset-2 scale-105' : ''}
      `}
      style={{
        borderColor: config.color,
        backgroundColor: 'white',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-md"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: config.color }}
        >
          <IconComponent className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm text-gray-800">
          {nodeData.label || config.label}
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        <p className="text-xs text-gray-600 whitespace-pre-wrap">
          {nodeData.content || 'Aucun contenu...'}
        </p>
        {nodeData.notes && (
          <p className="text-xs text-amber-600 mt-1 italic whitespace-pre-wrap">
            Note: {nodeData.notes}
          </p>
        )}
        {nodeData.options && nodeData.options.length > 0 && (
          <div className="mt-2 space-y-1">
            {nodeData.options.map((option, index) => (
              <div
                key={option.id}
                className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700"
              >
                {index + 1}. {option.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Handles */}
      {nodeData.type !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}
      {nodeData.type !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !border-2 !border-white"
          style={{ backgroundColor: config.color }}
        />
      )}
    </div>
  );
}

export default memo(ScriptNode);
