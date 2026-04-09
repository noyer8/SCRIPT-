import { useState } from 'react';
import { Phone, Building2, Check, Clock, AlertTriangle, CalendarClock, MessageSquare } from 'lucide-react';
import { useCrmStore } from '../../store/useCrmStore';
import type { Contact } from '../../store/useCrmStore';
import { isToday, isPast, formatDateFr } from '../../utils/dateUtils';

function getFermetureColor(fermeture: string): string {
  switch (fermeture) {
    case '17': return '#000000';
    case '18': return '#ef4444';
    case '18:30': return '#eab308';
    case '19': return '#22c55e';
    default: return '';
  }
}

export default function DailyCallList() {
  const { contacts, stages, setSelectedContact } = useCrmStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get contacts with callbacks today or overdue
  const overdueContacts: Contact[] = [];
  const todayContacts: Contact[] = [];

  contacts.forEach((c) => {
    if (!c.callbackDate) return;
    if (isToday(c.callbackDate)) {
      todayContacts.push(c);
    } else if (isPast(c.callbackDate)) {
      overdueContacts.push(c);
    }
  });

  // Sort by callbackTime
  const sortByTime = (a: Contact, b: Contact) => {
    if (!a.callbackTime && !b.callbackTime) return 0;
    if (!a.callbackTime) return 1;
    if (!b.callbackTime) return -1;
    return a.callbackTime.localeCompare(b.callbackTime);
  };

  overdueContacts.sort((a, b) => {
    // Older first
    return a.callbackDate.localeCompare(b.callbackDate);
  });
  todayContacts.sort(sortByTime);

  const copyPhone = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    if (contact.phone) {
      navigator.clipboard.writeText(contact.phone);
      setCopiedId(contact.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const getStageName = (stageId: string) => {
    return stages.find((s) => s.id === stageId)?.name || '';
  };

  const getStageColor = (stageId: string) => {
    return stages.find((s) => s.id === stageId)?.color || '#6b7280';
  };

  const renderContact = (contact: Contact, isOverdue: boolean) => (
    <div
      key={contact.id}
      onClick={() => setSelectedContact(contact.id)}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
        isOverdue
          ? 'bg-red-50 border-red-200 hover:border-red-300'
          : 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
      }`}
    >
      {/* Time */}
      <div className="flex-shrink-0 w-14 text-center">
        {contact.callbackTime ? (
          <span className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-yellow-700'}`}>
            {contact.callbackTime}
          </span>
        ) : (
          <span className="text-xs text-gray-400">--:--</span>
        )}
      </div>

      {/* Divider */}
      <div className={`w-0.5 h-10 rounded-full ${isOverdue ? 'bg-red-300' : 'bg-yellow-300'}`} />

      {/* Contact info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 truncate">
            {contact.firstName} {contact.lastName}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: getStageColor(contact.stageId) }}
          >
            {getStageName(contact.stageId)}
          </span>
          {contact.fermeture && (
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: getFermetureColor(contact.fermeture) }}
              title={`Fermeture ${contact.fermeture}h`}
            />
          )}
        </div>
        {contact.company && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{contact.company}</span>
          </div>
        )}
        {contact.callbackNote && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <MessageSquare className="w-3 h-3" />
            <span className="truncate">{contact.callbackNote}</span>
          </div>
        )}
      </div>

      {/* Phone */}
      {contact.phone && (
        <button
          onClick={(e) => copyPhone(e, contact)}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs bg-white border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors flex-shrink-0"
          title="Copier le numéro"
        >
          {copiedId === contact.id ? (
            <>
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-green-600">Copié</span>
            </>
          ) : (
            <>
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">{contact.phone}</span>
            </>
          )}
        </button>
      )}

      {/* Overdue date */}
      {isOverdue && (
        <span className="text-[10px] text-red-500 flex-shrink-0">
          {formatDateFr(contact.callbackDate)}
        </span>
      )}
    </div>
  );

  const total = overdueContacts.length + todayContacts.length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {total === 0 ? (
          <div className="text-center py-16">
            <CalendarClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucun appel prévu aujourd'hui</p>
            <p className="text-gray-400 text-xs mt-1">Les rappels du jour apparaîtront ici</p>
          </div>
        ) : (
          <>
            {/* Overdue section */}
            {overdueContacts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h2 className="text-sm font-semibold text-red-700">
                    En retard ({overdueContacts.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {overdueContacts.map((c) => renderContact(c, true))}
                </div>
              </div>
            )}

            {/* Today section */}
            {todayContacts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <h2 className="text-sm font-semibold text-yellow-700">
                    Aujourd'hui ({todayContacts.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {todayContacts.map((c) => renderContact(c, false))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
