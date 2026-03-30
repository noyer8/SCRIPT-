import { X, Phone, Mail, Building2, Globe, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useCrmStore } from '../store/useCrmStore';

export default function ProspectOverlay() {
  const { contacts, stages, pinnedContactId, setPinnedContact } = useCrmStore();
  const [copied, setCopied] = useState<string | null>(null);

  const contact = contacts.find((c) => c.id === pinnedContactId);
  if (!contact) return null;

  const stage = stages.find((s) => s.id === contact.stageId);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-72 bg-gray-900 text-gray-100 rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden"
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50"
        style={{ borderBottomColor: stage?.color || '#6366f1', borderBottomWidth: '2px' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-sm text-white truncate">
            {contact.firstName} {contact.lastName}
          </h3>
          {stage && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium flex-shrink-0"
              style={{ backgroundColor: stage.color }}
            >
              {stage.name}
            </span>
          )}
        </div>
        <button
          onClick={() => setPinnedContact(null)}
          className="p-1 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {contact.company && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{contact.company}</span>
          </div>
        )}

        {contact.phone && (
          <div className="group flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 text-xs">
            <Phone className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <a href={`tel:${contact.phone}`} className="text-green-400 hover:underline truncate flex-1">
              {contact.phone}
            </a>
            <button
              onClick={() => handleCopy(contact.phone, 'phone')}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-all"
            >
              {copied === 'phone' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
          </div>
        )}

        {contact.email && (
          <div className="group flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 text-xs">
            <Mail className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <a href={`mailto:${contact.email}`} className="text-blue-400 hover:underline truncate flex-1">
              {contact.email}
            </a>
            <button
              onClick={() => handleCopy(contact.email, 'email')}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-all"
            >
              {copied === 'email' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
          </div>
        )}

        {contact.facebookUrl && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 text-xs">
            <Globe className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
              {contact.facebookUrl}
            </a>
          </div>
        )}

        {contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 px-1">
            {contact.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
