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
import type { NodeType } from '../../types';
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

const nodeTypes: NodeType[] = [
  'start',
  'script',
  'question',
  'responses',
  'objection',
  'condition',
  'action',
  'transfer',
  'callback',
  'end',
];

export default function NodeToolbar() {
  const { player } = useStore();

  if (player.isActive) return null;

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-10">
      <div className="flex items-center gap-1">
        {nodeTypes.map((type) => {
          const config = NODE_TYPE_CONFIG[type];
          const IconComponent = iconMap[config.icon as keyof typeof iconMap];

          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className="group relative cursor-grab active:cursor-grabbing"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ backgroundColor: `${config.color}20` }}
              >
                <IconComponent
                  className="w-5 h-5"
                  style={{ color: config.color }}
                />
              </div>
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {config.label}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 text-center mt-1">
        Glissez-déposez pour ajouter
      </p>
    </div>
  );
}
