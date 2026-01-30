import { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { useCrmStore } from '../../store/useCrmStore';
import type { FieldType } from '../../store/useCrmStore';

interface Props {
  onClose: () => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texte' },
  { value: 'number', label: 'Nombre' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Liste déroulante' },
  { value: 'textarea', label: 'Texte long' },
  { value: 'checkbox', label: 'Case à cocher' },
];

export default function SettingsModal({ onClose }: Props) {
  const {
    stages,
    customFields,
    addStage,
    updateStage,
    deleteStage,
    addCustomField,
    updateCustomField,
    deleteCustomField,
  } = useCrmStore();

  const [tab, setTab] = useState<'stages' | 'fields'>('stages');
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6366f1');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const handleAddStage = () => {
    if (newStageName.trim()) {
      addStage(newStageName.trim(), newStageColor);
      setNewStageName('');
    }
  };

  const handleAddField = () => {
    if (newFieldName.trim()) {
      addCustomField({
        name: newFieldName.trim(),
        type: newFieldType,
        options: newFieldType === 'select' ? newFieldOptions.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
      });
      setNewFieldName('');
      setNewFieldOptions('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">Paramètres CRM</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            onClick={() => setTab('stages')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              tab === 'stages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            Étapes du pipeline
          </button>
          <button
            onClick={() => setTab('fields')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              tab === 'fields' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            Champs personnalisés
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'stages' && (
            <div className="space-y-4">
              {/* Existing stages */}
              <div className="space-y-2">
                {sortedStages.map((stage) => (
                  <div key={stage.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <input
                      type="color"
                      value={stage.color}
                      onChange={(e) => updateStage(stage.id, { color: e.target.value })}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={stage.name}
                      onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                      className="flex-1 px-3 py-1.5 border rounded text-sm"
                    />
                    <button
                      onClick={() => {
                        if (stages.length > 1) deleteStage(stage.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add stage */}
              <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                <input
                  type="color"
                  value={newStageColor}
                  onChange={(e) => setNewStageColor(e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                  className="flex-1 px-3 py-1.5 border rounded text-sm"
                  placeholder="Nouvelle étape..."
                />
                <button
                  onClick={handleAddStage}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </div>
          )}

          {tab === 'fields' && (
            <div className="space-y-4">
              {/* Existing fields */}
              <div className="space-y-2">
                {customFields.map((field) => (
                  <div key={field.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateCustomField(field.id, { name: e.target.value })}
                      className="flex-1 px-3 py-1.5 border rounded text-sm"
                    />
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">
                      {FIELD_TYPES.find((t) => t.value === field.type)?.label}
                    </span>
                    <button
                      onClick={() => deleteCustomField(field.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add field */}
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border rounded text-sm"
                    placeholder="Nom du champ..."
                  />
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                    className="px-3 py-1.5 border rounded text-sm"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                {newFieldType === 'select' && (
                  <input
                    type="text"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded text-sm"
                    placeholder="Options séparées par des virgules..."
                  />
                )}
                <button
                  onClick={handleAddField}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter le champ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
