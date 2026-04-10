import { useState, useCallback } from 'react';
import { Phone, Check, AlertTriangle, CalendarClock, CalendarPlus } from 'lucide-react';
import { useCrmStore } from '../../store/useCrmStore';
import type { Contact } from '../../store/useCrmStore';
import { isToday, isPast, formatDateFr, getTodayStr, getNextWorkdayStr } from '../../utils/dateUtils';
import { CALL_SLOTS, getCurrentSlot, assignBestSlot } from '../../utils/callSlots';
import CallTimeSuggestion from './CallTimeSuggestion';

function getFermetureColor(fermeture: string): string {
  switch (fermeture) {
    case '17': return '#000000';
    case '18': return '#ef4444';
    case '18:30': return '#eab308';
    case '19': return '#22c55e';
    default: return '';
  }
}

function getMissedCallsMax(stageName: string): number {
  const name = stageName.toLowerCase();
  if (name.includes('gatekeeper')) return 2;
  if (name.includes('froid')) return 3;
  return 0;
}

function getSlotForTime(time: string): string | null {
  if (!time) return null;
  for (const slot of CALL_SLOTS) {
    if (time === slot.start) return slot.id;
    if (time >= slot.start && time < slot.end) return slot.id;
  }
  return null;
}

export default function DailyCallList() {
  const { contacts, stages, setSelectedContact, updateContact, deleteContact, scheduleUnscheduled } = useCrmStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestionContactId, setSuggestionContactId] = useState<string | null>(null);

  const todayStr = getTodayStr();
  const currentSlot = getCurrentSlot();
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const first3StageIds = new Set(sortedStages.slice(0, 3).map((s) => s.id));
  const getStageName = (stageId: string) => stages.find((s) => s.id === stageId)?.name || '';

  // Count unscheduled prospects in first 3 columns
  const unscheduledCount = contacts.filter(
    (c) => first3StageIds.has(c.stageId) && !c.callbackDate
  ).length;

  // Overdue contacts
  const overdueContacts: Contact[] = [];
  // Today contacts grouped by slot
  const slotGroups = new Map<string, Contact[]>();
  CALL_SLOTS.forEach((s) => slotGroups.set(s.id, []));
  const ungrouped: Contact[] = [];

  contacts.forEach((c) => {
    if (!c.callbackDate) return;
    // Hide already called today
    if (c.lastCalledDate === todayStr) return;

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

  // Count called-today per slot (for progress bars)
  const calledTodayCounts = new Map<string, number>();
  CALL_SLOTS.forEach((s) => calledTodayCounts.set(s.id, 0));
  contacts.forEach((c) => {
    if (c.lastCalledDate === todayStr && c.callbackDate && isToday(c.callbackDate)) {
      // This was scheduled today and already called
    }
    if (c.lastCalledDate === todayStr) {
      // Find which slot they were in based on the original callbackTime before rescheduling
      // We can't know for sure, so we count by current time bucket
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

  const getStageColor = (stageId: string) => stages.find((s) => s.id === stageId)?.color || '#6b7280';

  const handleBouleClick = useCallback((contact: Contact, newCount: number, maxDots: number) => {
    if (newCount >= maxDots) {
      if (confirm(`${contact.firstName} ${contact.lastName} — ${maxDots} appels sans réponse. Supprimer ce prospect ?`)) {
        deleteContact(contact.id);
      }
      return;
    }

    // Auto-reschedule to next workday
    const nextDate = getNextWorkdayStr();
    const allContacts = useCrmStore.getState().contacts;
    const bestSlot = assignBestSlot(contact.fermeture, allContacts, nextDate);

    updateContact(contact.id, {
      missedCalls: newCount,
      lastCalledDate: todayStr,
      callbackDate: nextDate,
      callbackTime: bestSlot?.start || '09:00',
    });

    // Show picker for manual override
    setSuggestionContactId(contact.id);
  }, [todayStr, updateContact, deleteContact]);

  const renderBoules = (contact: Contact) => {
    const stageName = getStageName(contact.stageId);
    const maxDots = getMissedCallsMax(stageName);
    if (maxDots === 0 || !contact.phone) return null;
    const current = contact.missedCalls || 0;

    return (
      <div className="relative flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {Array.from({ length: maxDots }, (_, i) => {
          const isFilled = i < current;
          return (
            <button
              key={i}
              onClick={() => {
                if (isFilled && i === current - 1) {
                  updateContact(contact.id, { missedCalls: i });
                } else if (!isFilled) {
                  handleBouleClick(contact, i + 1, maxDots);
                }
              }}
              className="transition-all"
              title={isFilled ? 'Décocher' : `Appel ${i + 1} sans réponse`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 transition-colors ${
                  isFilled
                    ? 'bg-red-400 border-red-400'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              />
            </button>
          );
        })}
        <span className="text-[10px] text-gray-400 ml-0.5">{current}/{maxDots}</span>
        {suggestionContactId === contact.id && (
          <CallTimeSuggestion
            fermeture={contact.fermeture}
            onAccept={(date, time) => {
              updateContact(contact.id, { callbackDate: date, callbackTime: time });
              setSuggestionContactId(null);
            }}
            onDismiss={() => setSuggestionContactId(null)}
          />
        )}
      </div>
    );
  };

  const renderContact = (contact: Contact, variant: 'overdue' | 'today') => {
    const isOverdue = variant === 'overdue';
    return (
      <div
        key={contact.id}
        onClick={() => setSelectedContact(contact.id)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
          isOverdue
            ? 'bg-red-50 border-red-200 hover:border-red-300'
            : 'bg-white border-gray-200 hover:border-blue-300'
        }`}
      >
        {/* Boules */}
        {renderBoules(contact)}

        {/* Contact info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm text-gray-900 truncate">
              {contact.firstName} {contact.lastName}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full text-white"
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
            <div className="text-xs text-gray-500 truncate">{contact.company}</div>
          )}
        </div>

        {/* Phone */}
        {contact.phone && (
          <button
            onClick={(e) => copyPhone(e, contact)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors flex-shrink-0"
            title="Copier"
          >
            {copiedId === contact.id ? (
              <><Check className="w-3 h-3 text-green-500" /><span className="text-green-600">Copié</span></>
            ) : (
              <><Phone className="w-3 h-3 text-gray-400" /><span className="text-gray-600">{contact.phone}</span></>
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

  const totalToday = Array.from(slotGroups.values()).reduce((sum, arr) => sum + arr.length, 0) + ungrouped.length;
  const total = overdueContacts.length + totalToday;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-3">

        {/* Schedule button for unscheduled prospects */}
        {unscheduledCount > 0 && (
          <button
            onClick={() => scheduleUnscheduled()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
            Planifier {unscheduledCount} prospect{unscheduledCount > 1 ? 's' : ''} non assigné{unscheduledCount > 1 ? 's' : ''}
          </button>
        )}

        {total === 0 && unscheduledCount === 0 ? (
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
                <div className="space-y-1">
                  {overdueContacts.map((c) => renderContact(c, 'overdue'))}
                </div>
              </div>
            )}

            {/* 6 Slot sections — always shown */}
            {CALL_SLOTS.map((slot) => {
              const group = slotGroups.get(slot.id) || [];
              const isCurrent = currentSlot?.id === slot.id;
              const isPassed = currentHour >= slot.endHour;
              const isEmpty = group.length === 0;

              return (
                <div key={slot.id} className={isEmpty && isPassed ? 'opacity-40' : ''}>
                  {/* Slot header */}
                  <div className="flex items-center gap-2 mb-1.5 mt-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        isCurrent ? 'bg-green-500 animate-pulse' : isPassed ? 'bg-gray-300' : 'bg-blue-400'
                      }`}
                    />
                    <h2 className={`text-sm font-semibold ${
                      isCurrent ? 'text-green-700' : isPassed ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      {slot.start} – {slot.end}
                    </h2>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      group.length > 0
                        ? isCurrent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        : 'bg-gray-50 text-gray-400'
                    }`}>
                      {group.length} prospect{group.length !== 1 ? 's' : ''}
                    </span>
                    {slot.weight > 1 && (
                      <span className="text-[9px] text-gray-400">×{slot.weight}</span>
                    )}
                  </div>

                  {/* Contacts in slot */}
                  {group.length > 0 ? (
                    <div className="space-y-1">
                      {group.map((c) => renderContact(c, 'today'))}
                    </div>
                  ) : (
                    <div className={`text-xs py-2 px-3 rounded border border-dashed ${
                      isPassed ? 'border-gray-200 text-gray-300' : 'border-gray-200 text-gray-400'
                    }`}>
                      Aucun prospect
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ungrouped */}
            {ungrouped.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1.5 mt-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <h2 className="text-sm font-semibold text-gray-500">
                    Autre horaire ({ungrouped.length})
                  </h2>
                </div>
                <div className="space-y-1">
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
