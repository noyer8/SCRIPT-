import { useState } from 'react';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Settings,
  Filter,
  X,
  Users,
  Upload,
  RefreshCw,
  CalendarCheck,
  PhoneCall,
} from 'lucide-react';
import { getSyncConfig, pushToGist, saveSyncConfig } from '../../utils/gistSync';
import { useCrmStore } from '../../store/useCrmStore';
import Pipeline from './Pipeline';
import ListView from './ListView';
import DailyCallList from './DailyCallList';
import ContactDetail from './ContactDetail';
import AddContactModal from './AddContactModal';
import SettingsModal from './SettingsModal';
import ImportModal from './ImportModal';
import { Link } from 'react-router-dom';
import { isToday, isPast } from '../../utils/dateUtils';

export default function CrmPage() {
  const {
    view,
    setView,
    searchQuery,
    setSearchQuery,
    filterStageId,
    setFilterStage,
    filterTag,
    setFilterTag,
    stages,
    getAllTags,
    contacts,
    selectedContactId,
    showOnlyCallable,
    setShowOnlyCallable,
  } = useCrmStore();

  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const tags = getAllTags();
  const syncConfig = getSyncConfig();

  // Count daily calls (today + overdue)
  const dailyCallCount = contacts.filter(
    (c) => c.callbackDate && (isToday(c.callbackDate) || isPast(c.callbackDate))
  ).length;
  const isSyncConfigured = syncConfig.githubToken.length > 0;

  const handleQuickSync = async () => {
    setSyncing(true);
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
      saveSyncConfig({ ...syncConfig, gistId, lastSyncAt: now });
    } catch {
      // Silently fail for quick sync - user can use settings for details
    }
    setSyncing(false);
  };
  const hasFilters = !!filterStageId || !!filterTag;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        {/* Top row */}
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors hidden md:block"
            >
              ScriptFlow
            </Link>
            <span className="text-gray-300 hidden md:block">/</span>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h1 className="font-bold text-gray-900">CRM</h1>
            </div>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hidden sm:inline">
              {contacts.length} contacts
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search - hidden on mobile, shown in second row */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  hasFilters ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>

              {showFilters && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border p-4 z-20 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Étape</label>
                      <select
                        value={filterStageId || ''}
                        onChange={(e) => setFilterStage(e.target.value || null)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="">Toutes</option>
                        {stages.sort((a, b) => a.order - b.order).map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {tags.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Tag</label>
                        <select
                          value={filterTag || ''}
                          onChange={(e) => setFilterTag(e.target.value || null)}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        >
                          <option value="">Tous</option>
                          {tags.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {hasFilters && (
                      <button
                        onClick={() => { setFilterStage(null); setFilterTag(null); }}
                        className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                      >
                        <X className="w-3 h-3" />
                        Réinitialiser
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* "À appeler" toggle */}
            <button
              onClick={() => setShowOnlyCallable(!showOnlyCallable)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showOnlyCallable
                  ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={showOnlyCallable ? 'Afficher tous les prospects' : 'Afficher uniquement les prospects à appeler'}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showOnlyCallable ? 'À appeler' : 'Tous'}</span>
            </button>

            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setView('pipeline')}
                className={`p-1.5 rounded ${view === 'pipeline' ? 'bg-white shadow-sm' : ''}`}
                title="Pipeline"
              >
                <LayoutGrid className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm' : ''}`}
                title="Liste"
              >
                <List className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setView('daily')}
                className={`p-1.5 rounded relative ${view === 'daily' ? 'bg-white shadow-sm' : ''}`}
                title="Appels du jour"
              >
                <CalendarCheck className="w-4 h-4 text-gray-600" />
                {dailyCallCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {dailyCallCount > 9 ? '9+' : dailyCallCount}
                  </span>
                )}
              </button>
            </div>

            <div className="w-px h-6 bg-gray-200" />

            {isSyncConfigured && (
              <button
                onClick={handleQuickSync}
                disabled={syncing}
                className={`p-2 rounded-lg transition-colors ${syncing ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                title="Synchroniser"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            )}

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Paramètres"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={() => setShowImport(true)}
              className="p-2 sm:px-3 sm:py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Importer"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Importer</span>
            </button>

            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Contact</span>
            </button>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="md:hidden px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      {view === 'pipeline' ? <Pipeline /> : view === 'list' ? <ListView /> : <DailyCallList />}

      {/* Modals */}
      {selectedContactId && <ContactDetail />}
      {showAdd && <AddContactModal defaultStageId={stages[0]?.id || ''} onClose={() => setShowAdd(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
