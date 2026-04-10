import { useState } from 'react';
import { Phone, Building2, Check, AlertTriangle, CalendarClock, MessageSquare } from 'lucide-react';
import { useCrmStore } from '../../store/useCrmStore';
import type { Contact } from '../../store/useCrmStore';
import { isToday, isPast, formatDateFr } from '../../utils/dateUtils';
import { CALL_SLOTS } from '../../utils/callSlots';

function getFermetureColor(fermeture: string): string {
  switch (fermeture) {
    case '17': return '#000000';
    case '18': return '#ef4444';
    case '18:30': return '#eab308';
    case '19': return '#22c55e';
    default: return '';
  }
}

/** Map a callbackTime to its slot, or null */
function getSlotForTime(time: string): string | null {
  if (!time) return null;
  for (const slot of CALL_SLOTS) {
    if (time >= slot.start && time < slot.end) return slot.id;
    // Exact match on start
    if (time === slot.start) return slot.id;
  }
  return null;
}

export default function DailyCallList() {
  const { contacts, stages, setSelectedContact } = useCrmStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Overdue contacts
  const overdueContacts: Contact[] = [];
  // Today contacts grouped by slot
  const slotGroups = new Map<string, Contact[]>();
  const ungrouped: Contact[] = [];

  // Initialize groups
  CALL_SLOTS.forEach((s) => slotGroups.set(s.id, []));

  contacts.forEach((c) => {
    if (!c.callbackDate) return;
    if (isPast(c.callbackDate)) {
      overdueContacts.push(c);
    } else if (isToday(c.callbackDate)) {
      const slotId = getSlotForTime(c.callbackTime);
      if (slotId && slotGroups.has(slotId)) {
        slotGroups.get(slotId)!.push(c);
      } else {
        ungrouped.push(c);
      }
    }
  });

  overdueContacts.sort((a, b) => a.callbackDate.localeCompare(b.callbackDate));

  const copyPhone = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    if (contact.phone) {
      navigator.clipboard.writeText(contact.phone);
      setCopiedId(contact.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const getStageName = (stageId: string) => stages.find((s) => s.id === stageId)?.name || '';
  const getStageColor = (stageId: string) => stages.find((s) => s.id === stageId)?.color || '#6b7280';

  const renderContact = (contact: Contact, variant: 'overdue' | 'today') => {
    const isOverdue = variant === 'overdue';
    return (
      <div
        key={contact.id}
        onClick={() => setSelectedContact(contact.id)}
        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
          isOverdue
            ? 'bg-red-50 border-red-200 hover:border-red-300'
            : 'bg-white border-gray-200 hover:border-blue-300'
        }`}
      >
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
          <div className="flex items-center gap-3 mt-0.5">
            {contact.company && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Building2 className="w-3 h-3" />
                <span className="truncate">{contact.company}</span>
              </div>
            )}
            {contact.callbackNote && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MessageSquare className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{contact.callbackNote}</span>
              </div>
            )}
          </div>
        </div>

        {/* Phone */}
        {contact.phone && (
          <button
            onClick={(e) => copyPhone(e, contact)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-50 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors flex-shrink-0"
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

        {isOverdue && (
          <span className="text-[10px] text-red-500 flex-shrink-0">
            {formatDateFr(contact.callbackDate)}
          </span>
        )}
      </div>
    );
  };

  // Determine current time to highlight current/next slot
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const totalToday = Array.from(slotGroups.values()).reduce((sum, arr) => sum + arr.length, 0) + ungrouped.length;
  const total = overdueContacts.length + totalToday;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
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
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h2 className="text-sm font-semibold text-red-700">
                    En retard ({overdueContacts.length})
                  </h2>
                </div>
                <div className="space-y-1.5">
                  {overdueContacts.map((c) => renderContact(c, 'overdue'))}
                </div>
              </div>
            )}

            {/* Slot-based sections */}
            {CALL_SLOTS.map((slot) => {
              const group = slotGroups.get(slot.id) || [];
              if (group.length === 0) return null;

              const slotStart = slot.hour + slot.min / 60;
              const isCurrent = currentHour >= slotStart && currentHour < slot.endHour;
              const isPassed = currentHour >= slot.endHour;

              return (
                <div key={slot.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isCurrent ? 'bg-green-500 animate-pulse' : isPassed ? 'bg-gray-300' : 'bg-blue-400'
                      }`}
                    />
                    <h2 className={`text-sm font-semibold ${
                      isCurrent ? 'text-green-700' : isPassed ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      {slot.start} – {slot.end}
                    </h2>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                      {group.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {group.map((c) => renderContact(c, 'today'))}
                  </div>
                </div>
              );
            })}

            {/* Ungrouped (time doesn't match any slot) */}
            {ungrouped.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <h2 className="text-sm font-semibold text-gray-500">
                    Autre horaire ({ungrouped.length})
                  </h2>
                </div>
                <div className="space-y-1.5">
                  {ungrouped.map((c) => renderContact(c, 'today'))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
