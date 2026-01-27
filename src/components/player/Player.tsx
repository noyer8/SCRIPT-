import { useMemo } from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  PhoneOff,
  Calendar,
  Phone,
  Play,
  FileText,
  HelpCircle,
  AlertTriangle,
  GitBranch,
  Zap,
  Square,
  PhoneForwarded,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { NodeType } from '../../types';
import { NODE_TYPE_CONFIG } from '../../types';

const iconMap: Record<string, React.ElementType> = {
  Play,
  FileText,
  HelpCircle,
  AlertTriangle,
  GitBranch,
  Zap,
  Square,
  PhoneForwarded,
  Clock,
};

export default function Player() {
  const {
    getCurrentScript,
    player,
    stopPlayer,
    goToNode,
    goBack,
    updatePlayerNotes,
  } = useStore();

  const script = getCurrentScript();

  const currentNode = useMemo(() => {
    if (!script || !player.currentNodeId) return null;
    return script.nodes.find((n) => n.id === player.currentNodeId);
  }, [script, player.currentNodeId]);

  const connectedNodes = useMemo(() => {
    if (!script || !currentNode) return [];

    const outgoingEdges = script.edges.filter((e) => e.source === currentNode.id);
    return outgoingEdges.map((edge) => {
      const targetNode = script.nodes.find((n) => n.id === edge.target);
      return targetNode;
    }).filter(Boolean);
  }, [script, currentNode]);

  const elapsedTime = useMemo(() => {
    if (!player.startTime) return '00:00';
    const elapsed = Math.floor((Date.now() - player.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [player.startTime]);

  if (!player.isActive || !currentNode) return null;

  const nodeConfig = NODE_TYPE_CONFIG[currentNode.data.type];
  const IconComponent = iconMap[nodeConfig.icon];

  const handleEndCall = (outcome: 'success' | 'failure' | 'callback') => {
    const outcomeLabels = {
      success: 'Appel réussi',
      failure: 'Appel non abouti',
      callback: 'Rappel programmé',
    };
    alert(`Appel terminé: ${outcomeLabels[outcome]}\n\nDurée: ${elapsedTime}\nNotes: ${player.notes || 'Aucune'}`);
    stopPlayer();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <Phone className="w-5 h-5" />
              <span className="font-semibold">{script?.name}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-white text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{elapsedTime}</span>
            </div>
          </div>
          <button
            onClick={stopPlayer}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Étape {player.history.length}</span>
            <span className="text-gray-400">•</span>
            <div className="flex items-center gap-1">
              {player.history.slice(-5).map((nodeId, index) => {
                const node = script?.nodes.find((n) => n.id === nodeId);
                const config = node ? NODE_TYPE_CONFIG[node.data.type] : null;
                return (
                  <div
                    key={nodeId + index}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config?.color || '#94a3b8' }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current node card */}
          <div
            className="rounded-xl border-2 p-6 mb-6"
            style={{
              borderColor: nodeConfig.color,
              backgroundColor: `${nodeConfig.color}08`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: nodeConfig.color }}
              >
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {currentNode.data.label}
                </h2>
                <p className="text-sm text-gray-500">{nodeConfig.label}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {currentNode.data.content}
              </p>
            </div>

            {currentNode.data.notes && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> {currentNode.data.notes}
                </p>
              </div>
            )}
          </div>

          {/* Options / Next steps */}
          {currentNode.data.options && currentNode.data.options.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Réponses possibles:
              </h3>
              {currentNode.data.options.map((option, index) => {
                const connectedNode = connectedNodes[index];
                return (
                  <button
                    key={option.id}
                    onClick={() => connectedNode && goToNode(connectedNode.id)}
                    disabled={!connectedNode}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      connectedNode
                        ? 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-800">{option.label}</span>
                      {connectedNode && (
                        <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : connectedNodes.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Étapes suivantes:
              </h3>
              {connectedNodes.map((node) => {
                if (!node) return null;
                const config = NODE_TYPE_CONFIG[node.data.type as NodeType];
                const Icon = iconMap[config.icon];
                return (
                  <button
                    key={node.id}
                    onClick={() => goToNode(node.id)}
                    className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">{node.data.label}</span>
                        <p className="text-xs text-gray-500 truncate">{node.data.content}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : currentNode.data.type === 'end' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Fin du script
              </h3>
              <p className="text-gray-500 mb-6">
                Sélectionnez le résultat de l'appel
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleEndCall('success')}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Succès
                </button>
                <button
                  onClick={() => handleEndCall('callback')}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  Rappel
                </button>
                <button
                  onClick={() => handleEndCall('failure')}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Échec
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>Aucune connexion sortante</p>
              <p className="text-sm">Connectez ce nœud à d'autres dans l'éditeur</p>
            </div>
          )}

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes de l'appel
            </label>
            <textarea
              value={player.notes}
              onChange={(e) => updatePlayerNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Prenez des notes pendant l'appel..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={goBack}
            disabled={player.history.length <= 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <button
            onClick={() => handleEndCall('failure')}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            Terminer l'appel
          </button>
        </div>
      </div>
    </div>
  );
}
