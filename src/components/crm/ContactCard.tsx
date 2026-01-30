import { Building2, Phone, Mail } from 'lucide-react';
import { useCrmStore } from '../../store/useCrmStore';
import type { Contact } from '../../store/useCrmStore';

export default function ContactCard({ contact }: { contact: Contact }) {
  const { setSelectedContact } = useCrmStore();

  return (
    <div
      onClick={() => setSelectedContact(contact.id)}
      className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-medium text-sm text-gray-900">
          {contact.firstName} {contact.lastName}
        </div>
      </div>

      {contact.company && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Building2 className="w-3 h-3" />
          <span>{contact.company}</span>
        </div>
      )}
      {contact.phone && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Phone className="w-3 h-3" />
          <span>{contact.phone}</span>
        </div>
      )}
      {contact.email && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Mail className="w-3 h-3" />
          <span className="truncate">{contact.email}</span>
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
