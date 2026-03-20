import { Building2, Phone, Mail, Pin, Globe, Check } from 'lucide-react';
import { useState } from 'react';
import { useCrmStore } from '../../store/useCrmStore';
import type { Contact } from '../../store/useCrmStore';
import { openProspectPopout } from '../../utils/openProspectPopout';

export default function ContactCard({ contact }: { contact: Contact }) {
  const { setSelectedContact, setPinnedContact, pinnedContactId, stages } = useCrmStore();
  const [phoneCopied, setPhoneCopied] = useState(false);

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pinnedContactId === contact.id) {
      setPinnedContact(null);
    } else {
      setPinnedContact(contact.id);
      const stage = stages.find((s) => s.id === contact.stageId);
      openProspectPopout(contact, stage);
    }
  };

  return (
    <div
      onClick={() => setSelectedContact(contact.id)}
      className="group bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-medium text-sm text-gray-900">
          {contact.firstName} {contact.lastName}
        </div>
        <button
          onClick={handlePin}
          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
            pinnedContactId === contact.id
              ? 'opacity-100 bg-amber-100 text-amber-600'
              : 'hover:bg-amber-50 text-amber-500'
          }`}
          title="Épingler en overlay"
        >
          <Pin className="w-3.5 h-3.5" />
        </button>
      </div>

      {contact.company && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Building2 className="w-3 h-3" />
          <span>{contact.company}</span>
        </div>
      )}
      {contact.phone && (
        <div
          className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 cursor-pointer hover:text-green-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(contact.phone);
            setPhoneCopied(true);
            setTimeout(() => setPhoneCopied(false), 1500);
          }}
          title="Cliquer pour copier"
        >
          {phoneCopied ? <Check className="w-3 h-3 text-green-500" /> : <Phone className="w-3 h-3" />}
          <span>{phoneCopied ? 'Copié !' : contact.phone}</span>
        </div>
      )}
      {contact.email && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Mail className="w-3 h-3" />
          <span className="truncate">{contact.email}</span>
        </div>
      )}
      {contact.facebookUrl && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Globe className="w-3 h-3 text-blue-500" />
          <a
            href={contact.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-500 hover:underline truncate"
          >
            {contact.facebookUrl.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        </div>
      )}

      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {contact.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
