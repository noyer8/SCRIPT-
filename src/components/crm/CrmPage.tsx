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
} from 'lucide-react';
import { useCrmStore } from '../../store/useCrmStore';
import Pipeline from './Pipeline';
import ListView from './ListView';
import ContactDetail from './ContactDetail';
import AddContactModal from './AddContactModal';
import SettingsModal from './SettingsModal';
import { Link } from 'react-router-dom';

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
  } = useCrmStore();

  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const tags = getAllTags();
  const hasFilters = !!filterStageId || !!filterTag;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ScriptFlow
          </Link>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h1 className="font-bold text-gray-900">CRM</h1>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {contacts.length} contacts
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
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

          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('pipeline')}
              className={`p-1.5 rounded ${view === 'pipeline' ? 'bg-white shadow-sm' : ''}`}
            >
              <LayoutGrid className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200" />

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Contact
          </button>
        </div>
      </header>

      {/* Content */}
      {view === 'pipeline' ? <Pipeline /> : <ListView />}

      {/* Modals */}
      {selectedContactId && <ContactDetail />}
      {showAdd && <AddContactModal defaultStageId={stages[0]?.id || ''} onClose={() => setShowAdd(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
