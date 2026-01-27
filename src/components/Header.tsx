import { Play, Download, Upload, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useRef, useState } from 'react';
import type { Script } from '../types';

export default function Header() {
  const { getCurrentScript, startPlayer, scripts, updateScript } = useStore();
  const [showInfo, setShowInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const script = getCurrentScript();

  const handleExport = () => {
    if (!script) return;

    const dataStr = JSON.stringify(script, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as Script;
        const existingScript = scripts.find((s) => s.id === imported.id);

        if (existingScript) {
          if (confirm('Un script avec cet ID existe déjà. Voulez-vous le mettre à jour ?')) {
            updateScript(imported.id, imported);
          }
        } else {
          useStore.getState().scripts.push(imported);
          useStore.setState({ scripts: [...useStore.getState().scripts] });
        }
      } catch {
        alert('Erreur lors de l\'import du fichier');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left - Script info */}
      <div className="flex items-center gap-4">
        {script ? (
          <>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">{script.name}</h2>
              <p className="text-xs text-gray-500">
                {script.nodes.length} nœuds • {script.edges.length} connexions
              </p>
            </div>
          </>
        ) : (
          <span className="text-sm text-gray-500">Sélectionnez un script</span>
        )}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        {script && (
          <>
            <button
              onClick={startPlayer}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Play className="w-4 h-4" />
              Lancer
            </button>

            <div className="w-px h-6 bg-gray-200 mx-2" />

            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Exporter"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Importer"
        >
          <Upload className="w-5 h-5 text-gray-600" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        <div className="relative">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Info"
          >
            <Info className="w-5 h-5 text-gray-600" />
          </button>

          {showInfo && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowInfo(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-20">
                <h3 className="font-semibold text-gray-900 mb-2">ScriptFlow</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Créez et gérez vos scripts d'appels téléphoniques de manière visuelle.
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Glissez-déposez les nœuds pour créer votre arbre</p>
                  <p>• Connectez les nœuds en tirant depuis les points</p>
                  <p>• Cliquez sur un nœud pour le modifier</p>
                  <p>• Lancez le script pour le parcourir</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
