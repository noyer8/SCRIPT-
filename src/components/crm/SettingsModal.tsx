import { useState } from 'react';
import { X, Plus, Trash2, GripVertical, RefreshCw, Upload, Download, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useCrmStore } from '../../store/useCrmStore';
import type { FieldType, Contact, PipelineStage, CustomField, Activity } from '../../store/useCrmStore';
import { getSyncConfig, saveSyncConfig, pushToGist, pullFromGist, validateToken, findExistingGist } from '../../utils/gistSync';

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
  const store = useCrmStore();
  const {
    stages,
    customFields,
    addStage,
    updateStage,
    deleteStage,
    addCustomField,
    updateCustomField,
    deleteCustomField,
    reorderStages,
  } = store;

  const [tab, setTab] = useState<'stages' | 'fields' | 'sync'>('stages');
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6366f1');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Sync state
  const [syncConfig, setSyncConfig] = useState(getSyncConfig);
  const [tokenInput, setTokenInput] = useState(syncConfig.githubToken);
  const [showToken, setShowToken] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pushing' | 'pulling' | 'validating'>('idle');
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const handleAddStage = () => {
    if (newStageName.trim()) {
      addStage(newStageName.trim(), newStageColor);
      setNewStageName('');
    }
  };

  const handleStageDragStart = (stageId: string) => {
    setDraggedStageId(stageId);
  };

  const handleStageDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleStageDrop = (targetStageId: string) => {
    if (!draggedStageId || draggedStageId === targetStageId) {
      setDraggedStageId(null);
      setDragOverStageId(null);
      return;
    }
    const reordered = [...sortedStages];
    const fromIndex = reordered.findIndex((s) => s.id === draggedStageId);
    const toIndex = reordered.findIndex((s) => s.id === targetStageId);
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    reorderStages(reordered.map((s, i) => ({ ...s, order: i })));
    setDraggedStageId(null);
    setDragOverStageId(null);
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

  const handleSaveToken = async () => {
    setSyncStatus('validating');
    setSyncMessage(null);
    const valid = await validateToken(tokenInput);
    if (valid) {
      // Auto-find existing CRM gist
      const existingGistId = await findExistingGist(tokenInput);
      const newConfig = { ...syncConfig, githubToken: tokenInput, gistId: existingGistId ?? syncConfig.gistId };
      saveSyncConfig(newConfig);
      setSyncConfig(newConfig);
      if (existingGistId) {
        setSyncMessage({ type: 'success', text: 'Token valide ! Gist CRM trouvé automatiquement.' });
      } else {
        setSyncMessage({ type: 'success', text: 'Token valide et sauvegardé !' });
      }
    } else {
      setSyncMessage({ type: 'error', text: 'Token invalide. Vérifie qu\'il a les permissions "gist".' });
    }
    setSyncStatus('idle');
  };

  const handlePush = async () => {
    setSyncStatus('pushing');
    setSyncMessage(null);
    try {
      const state = useCrmStore.getState();
      const data = {
        contacts: state.contacts,
        stages: state.stages,
        customFields: state.customFields,
        activities: state.activities,
      };
      const gistId = await pushToGist(syncConfig.githubToken, syncConfig.gistId, data);
      const now = new Date().toISOString();
      const newConfig = { ...syncConfig, gistId, lastSyncAt: now };
      saveSyncConfig(newConfig);
      setSyncConfig(newConfig);
      setSyncMessage({ type: 'success', text: `Données envoyées ! (${state.contacts.length} contacts)` });
    } catch (e: unknown) {
      setSyncMessage({ type: 'error', text: `Erreur : ${e instanceof Error ? e.message : 'Erreur inconnue'}` });
    }
    setSyncStatus('idle');
  };

  const handlePull = async () => {
    if (!syncConfig.gistId) {
      setSyncMessage({ type: 'error', text: 'Aucun Gist configuré. Fais d\'abord un envoi.' });
      return;
    }
    setSyncStatus('pulling');
    setSyncMessage(null);
    try {
      const data = await pullFromGist(syncConfig.githubToken, syncConfig.gistId) as {
        contacts?: Contact[];
        stages?: PipelineStage[];
        customFields?: CustomField[];
        activities?: Activity[];
      };
      store.replaceData(data);
      const now = new Date().toISOString();
      const newConfig = { ...syncConfig, lastSyncAt: now };
      saveSyncConfig(newConfig);
      setSyncConfig(newConfig);
      const contactCount = Array.isArray(data.contacts) ? data.contacts.length : 0;
      setSyncMessage({ type: 'success', text: `Données récupérées ! (${contactCount} contacts)` });
    } catch (e: unknown) {
      setSyncMessage({ type: 'error', text: `Erreur : ${e instanceof Error ? e.message : 'Erreur inconnue'}` });
    }
    setSyncStatus('idle');
  };

  const handleDisconnect = () => {
    saveSyncConfig({ githubToken: '', gistId: null, lastSyncAt: null });
    setSyncConfig({ githubToken: '', gistId: null, lastSyncAt: null });
    setTokenInput('');
    setSyncMessage(null);
  };

  const isTokenSaved = syncConfig.githubToken.length > 0;

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
          <button
            onClick={() => setTab('sync')}
            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-1.5 ${
              tab === 'sync' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Synchronisation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'stages' && (
            <div className="space-y-4">
              {/* Existing stages */}
              <div className="space-y-2">
                {sortedStages.map((stage) => (
                  <div
                    key={stage.id}
                    draggable
                    onDragStart={() => handleStageDragStart(stage.id)}
                    onDragOver={(e) => handleStageDragOver(e, stage.id)}
                    onDrop={() => handleStageDrop(stage.id)}
                    onDragEnd={() => { setDraggedStageId(null); setDragOverStageId(null); }}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      dragOverStageId === stage.id ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
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

          {tab === 'sync' && (
            <div className="space-y-6">
              {/* Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">Synchronise ton CRM entre tes appareils</p>
                <p>Tes contacts sont stockés dans un Gist GitHub privé. Tu peux y accéder depuis ton téléphone ou un autre ordinateur.</p>
              </div>

              {/* Token setup */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 block">Token GitHub (Personal Access Token)</label>
                <p className="text-xs text-gray-500">
                  Crée un token sur{' '}
                  <a href="https://github.com/settings/tokens/new?scopes=gist&description=ScriptFlow+CRM+Sync" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    github.com/settings/tokens
                  </a>
                  {' '}avec la permission <strong>gist</strong>.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="w-full px-3 py-2 border rounded-lg text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={handleSaveToken}
                    disabled={syncStatus === 'validating' || !tokenInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {syncStatus === 'validating' ? 'Vérification...' : 'Enregistrer'}
                  </button>
                </div>
              </div>

              {/* Sync actions */}
              {isTokenSaved && (
                <div className="space-y-4">
                  <div className="h-px bg-gray-200" />

                  {syncConfig.lastSyncAt && (
                    <p className="text-xs text-gray-500">
                      Dernière sync : {new Date(syncConfig.lastSyncAt).toLocaleString('fr-FR')}
                    </p>
                  )}

                  {syncConfig.gistId && (
                    <p className="text-xs text-gray-400">
                      Gist ID : <code className="bg-gray-100 px-1 rounded">{syncConfig.gistId}</code>
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handlePush}
                      disabled={syncStatus !== 'idle'}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {syncStatus === 'pushing' ? 'Envoi...' : 'Envoyer vers le cloud'}
                    </button>
                    <button
                      onClick={handlePull}
                      disabled={syncStatus !== 'idle' || !syncConfig.gistId}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {syncStatus === 'pulling' ? 'Récupération...' : 'Récupérer du cloud'}
                    </button>
                  </div>

                  <button
                    onClick={handleDisconnect}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Déconnecter le compte GitHub
                  </button>
                </div>
              )}

              {/* Status message */}
              {syncMessage && (
                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  syncMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {syncMessage.type === 'success' ? <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <span>{syncMessage.text}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
