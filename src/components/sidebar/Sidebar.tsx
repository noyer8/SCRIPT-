import { useState } from 'react';
import {
  Plus,
  Search,
  FileText,
  Trash2,
  Copy,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Play,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Script } from '../../types';

function ScriptItem({ script, isActive }: { script: Script; isActive: boolean }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(script.name);

  const {
    setCurrentScript,
    deleteScript,
    duplicateScript,
    updateScript,
    startPlayer,
  } = useStore();

  const handleRename = () => {
    if (name.trim() && name !== script.name) {
      updateScript(script.id, { name: name.trim() });
    }
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer ce script ?')) {
      deleteScript(script.id);
    }
    setShowMenu(false);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateScript(script.id);
    setShowMenu(false);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentScript(script.id);
    setTimeout(() => startPlayer(), 100);
    setShowMenu(false);
  };

  const formattedDate = new Date(script.updatedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      onClick={() => setCurrentScript(script.id)}
      className={`
        group relative p-3 rounded-lg cursor-pointer transition-all
        ${isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isActive ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        >
          <FileText className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 text-sm font-medium border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <h3 className="text-sm font-medium text-gray-900 truncate">{script.name}</h3>
          )}
          <p className="text-xs text-gray-500 mt-0.5">
            {script.nodes.length} nœuds • {formattedDate}
          </p>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={handlePlay}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Lancer le script
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Renommer
                </button>
                <button
                  onClick={handleDuplicate}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Dupliquer
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { scripts, currentScriptId, createScript, isPanelOpen, togglePanel } = useStore();
  const [search, setSearch] = useState('');

  const filteredScripts = scripts.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isPanelOpen) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={togglePanel}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900">ScriptFlow</h1>
          <button
            onClick={togglePanel}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Scripts list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredScripts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              {search ? 'Aucun script trouvé' : 'Aucun script'}
            </p>
            {!search && (
              <p className="text-xs text-gray-400 mt-1">
                Créez votre premier script
              </p>
            )}
          </div>
        ) : (
          filteredScripts.map((script) => (
            <ScriptItem
              key={script.id}
              script={script}
              isActive={script.id === currentScriptId}
            />
          ))
        )}
      </div>

      {/* New script button */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={createScript}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouveau script
        </button>
      </div>
    </div>
  );
}
