import { useCallback, useEffect, useState } from 'react';
import { X, Trash2, Plus, GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store/useStore';
import type { NodeOption, ScriptNodeData } from '../../types';
import { NODE_TYPE_CONFIG } from '../../types';

export default function PropertiesPanel() {
  const {
    getCurrentScript,
    selectedNodeId,
    setSelectedNode,
    updateNode,
    deleteNode,
    player,
  } = useStore();

  const script = getCurrentScript();
  const selectedNode = script?.nodes.find((n) => n.id === selectedNodeId);

  const [localData, setLocalData] = useState<ScriptNodeData | null>(null);

  useEffect(() => {
    if (selectedNode) {
      setLocalData({ ...selectedNode.data });
    } else {
      setLocalData(null);
    }
  }, [selectedNode]);

  const handleChange = useCallback(
    (field: keyof ScriptNodeData, value: string | NodeOption[]) => {
      if (!localData || !selectedNodeId) return;

      const newData = { ...localData, [field]: value };
      setLocalData(newData);
      updateNode(selectedNodeId, { [field]: value });
    },
    [localData, selectedNodeId, updateNode]
  );

  const addOption = useCallback(() => {
    if (!localData) return;

    const newOption: NodeOption = {
      id: uuidv4(),
      label: `Option ${(localData.options?.length || 0) + 1}`,
    };

    const newOptions = [...(localData.options || []), newOption];
    handleChange('options', newOptions);
  }, [localData, handleChange]);

  const updateOption = useCallback(
    (optionId: string, label: string) => {
      if (!localData?.options) return;

      const newOptions = localData.options.map((opt) =>
        opt.id === optionId ? { ...opt, label } : opt
      );
      handleChange('options', newOptions);
    },
    [localData, handleChange]
  );

  const removeOption = useCallback(
    (optionId: string) => {
      if (!localData?.options) return;

      const newOptions = localData.options.filter((opt) => opt.id !== optionId);
      handleChange('options', newOptions);
    },
    [localData, handleChange]
  );

  const handleDelete = useCallback(() => {
    if (selectedNodeId && confirm('Supprimer ce nœud ?')) {
      deleteNode(selectedNodeId);
    }
  }, [selectedNodeId, deleteNode]);

  if (player.isActive || !selectedNode || !localData) {
    return null;
  }

  const config = NODE_TYPE_CONFIG[localData.type];

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: `${config.color}10` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="font-semibold text-gray-800">{config.label}</span>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre du nœud
          </label>
          <input
            type="text"
            value={localData.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Titre..."
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contenu / Script
          </label>
          <textarea
            value={localData.content || ''}
            onChange={(e) => handleChange('content', e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
            placeholder="Entrez le texte à lire..."
          />
        </div>

        {/* Options for questions/responses */}
        {(localData.type === 'question' || localData.type === 'condition' || localData.type === 'responses') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                {localData.type === 'responses' ? 'Phrases possibles du client' : 'Options de réponse'}
              </label>
              <button
                onClick={addOption}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3 h-3" />
                Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {localData.options?.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg"
                >
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                  <span className="text-xs text-gray-500 w-4">{index + 1}.</span>
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Label de l'option..."
                  />
                  <button
                    onClick={() => removeOption(option.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(!localData.options || localData.options.length === 0) && (
                <p className="text-xs text-gray-400 text-center py-2">
                  Aucune option. Cliquez sur "Ajouter" pour en créer.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes internes
          </label>
          <textarea
            value={localData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
            placeholder="Notes pour vous-même (non visibles au prospect)..."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer ce nœud
        </button>
      </div>
    </div>
  );
}
