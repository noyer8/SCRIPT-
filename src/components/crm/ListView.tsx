import { useCrmStore } from '../../store/useCrmStore';
import { ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

type SortKey = 'name' | 'company' | 'stage' | 'updated';

export default function ListView() {
  const { getFilteredContacts, stages, setSelectedContact } = useCrmStore();
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [sortAsc, setSortAsc] = useState(false);

  const contacts = getFilteredContacts();

  const sorted = [...contacts].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    switch (sortKey) {
      case 'name':
        return dir * `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'company':
        return dir * a.company.localeCompare(b.company);
      case 'stage': {
        const sa = stages.find((s) => s.id === a.stageId);
        const sb = stages.find((s) => s.id === b.stageId);
        return dir * ((sa?.order || 0) - (sb?.order || 0));
      }
      case 'updated':
        return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      default:
        return 0;
    }
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
    >
      {label}
      {sortKey === field && <ArrowUpDown className="w-3 h-3" />}
    </button>
  );

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3"><SortHeader label="Nom" field="name" /></th>
              <th className="text-left px-4 py-3"><SortHeader label="Entreprise" field="company" /></th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Téléphone</th>
              <th className="text-left px-4 py-3"><SortHeader label="Étape" field="stage" /></th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Tags</th>
              <th className="text-left px-4 py-3"><SortHeader label="Modifié" field="updated" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((c) => {
              const stage = stages.find((s) => s.id === c.stageId);
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelectedContact(c.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-sm text-gray-900">
                      {c.firstName} {c.lastName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.company}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: stage?.color }}
                    >
                      {stage?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-1">
                      {c.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                      {c.tags.length > 2 && (
                        <span className="text-xs text-gray-400">+{c.tags.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(c.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  Aucun contact trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
