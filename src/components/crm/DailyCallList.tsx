import { useState, useCallback } from 'react';
import { Phone, Check, AlertTriangle, CalendarPlus } from 'lucide-react';
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
  const gatekeeperStageIds = new Set(
    sortedStages.filter((s) => s.name.toLowerCase().includes('gatekeeper')).map((s) => s.id)
  );
  const getStageName = (stageId: string) => stages.find((s) => s.id === stageId)?.name || '';

  // Count unscheduled prospects in first 3 columns (excluding gatekeeper)
  const unscheduledCount = contacts.filter(
    (c) => first3StageIds.has(c.stageId) && !gatekeeperStageIds.has(c.stageId) && !c.callbackDate
  ).length;

  // Overdue contacts
  const overdueContacts: Contact[] = [];
  // Today contacts grouped by slot
  const slotGroups = new Map<string, Contact[]>();
  CALL_SLOTS.forEach((s) => slotGroups.set(s.id, []));

  contacts.forEach((c) => {
    if (!c.callbackDate) return;
    if (c.lastCalledDate === todayStr) return;

    if (isPast(c.callbackDate)) {
      overdueContacts.push(c);
    } else if (isToday(c.callbackDate)) {
      const slotId = getSlotForTime(c.callbackTime);
      if (slotId && slotGroups.has(slotId)) {
        slotGroups.get(slotId)!.push(c);
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

  const handleBouleClick = useCallback((contact: Contact, newCount: number, maxDots: number) => {
    if (newCount >= maxDots) {
      if (confirm(`${contact.firstName} ${contact.lastName} — ${maxDots} appels sans réponse. Supprimer ce prospect ?`)) {
        deleteContact(contact.id);
      }
      return;
    }

    const nextDate = getNextWorkdayStr();
    const allContacts = useCrmStore.getState().contacts;
    const bestSlot = assignBestSlot(contact.fermeture, allContacts, nextDate);

    updateContact(contact.id, {
      missedCalls: newCount,
      lastCalledDate: todayStr,
      callbackDate: nextDate,
      callbackTime: bestSlot?.start || '09:00',
    });

    setSuggestionContactId(contact.id);
  }, [todayStr, updateContact, deleteContact]);

  const renderBoules = (contact: Contact) => {
    const stageName = getStageName(contact.stageId);
    const maxDots = getMissedCallsMax(stageName);
    if (maxDots === 0 || !contact.phone) return null;
    const current = contact.missedCalls || 0;

    return (
      <div className="relative flex items-center gap-0.5 mb-1.5" onClick={(e) => e.stopPropagation()}>
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

  const renderCard = (contact: Contact, isOverdue = false) => (
    <div
      key={contact.id}
      onClick={() => setSelectedContact(contact.id)}
      className={`p-2.5 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
        isOverdue
          ? 'bg-red-50 border-red-200 hover:border-red-300'
          : 'bg-white border-gray-200 hover:border-blue-300'
      }`}
    >
      {/* Boules */}
      {renderBoules(contact)}

      {/* Name + fermeture */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="font-medium text-sm text-gray-900 truncate">
          {contact.firstName} {contact.lastName}
        </span>
        {contact.fermeture && (
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: getFermetureColor(contact.fermeture) }}
            title={`Fermeture ${contact.fermeture}h`}
          />
        )}
      </div>

      {/* Company */}
      {contact.company && (
        <div className="text-xs text-gray-500 truncate mb-1.5">{contact.company}</div>
      )}

      {/* Phone — copyable */}
      {contact.phone && (
        <button
          onClick={(e) => copyPhone(e, contact)}
          className="flex items-center gap-1 w-full px-2 py-1 text-xs bg-gray-50 border rounded hover:bg-green-50 hover:border-green-300 transition-colors"
          title="Copier le numéro"
        >
          {copiedId === contact.id ? (
            <><Check className="w-3 h-3 text-green-500" /><span className="text-green-600">Copié</span></>
          ) : (
            <><Phone className="w-3 h-3 text-gray-400" /><span className="text-gray-600 truncate">{contact.phone}</span></>
          )}
        </button>
      )}

      {/* Overdue date */}
      {isOverdue && (
        <div className="text-[10px] text-red-500 mt-1">{formatDateFr(contact.callbackDate)}</div>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-x-auto p-4 sm:p-6">
      {/* Schedule button */}
      {unscheduledCount > 0 && (
        <div className="mb-3 max-w-full">
          <button
            onClick={() => scheduleUnscheduled()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
            Planifier {unscheduledCount} prospect{unscheduledCount > 1 ? 's' : ''} non assigné{unscheduledCount > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Kanban board */}
      <div className="flex gap-3 h-full min-w-max">
        {/* Overdue column */}
        {overdueContacts.length > 0 && (
          <div className="w-56 flex flex-col bg-red-50 rounded-xl border-2 border-red-200 flex-shrink-0">
            <div className="flex items-center gap-2 p-3 border-b border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-sm text-red-700">En retard</h3>
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                {overdueContacts.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {overdueContacts.map((c) => renderCard(c, true))}
            </div>
          </div>
        )}

        {/* 6 Slot columns */}
        {CALL_SLOTS.map((slot) => {
          const group = slotGroups.get(slot.id) || [];
          const isCurrent = currentSlot?.id === slot.id;
          const isPassed = currentHour >= slot.endHour;
          const isEmpty = group.length === 0;

          return (
            <div
              key={slot.id}
              className={`w-56 flex flex-col rounded-xl border-2 flex-shrink-0 transition-colors ${
                isCurrent
                  ? 'bg-green-50 border-green-300'
                  : isEmpty && isPassed
                    ? 'bg-gray-50 border-transparent opacity-50'
                    : 'bg-gray-50 border-transparent'
              }`}
            >
              {/* Slot header */}
              <div className="flex items-center gap-2 p-3 border-b border-gray-200">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    isCurrent ? 'bg-green-500 animate-pulse' : isPassed ? 'bg-gray-300' : 'bg-blue-400'
                  }`}
                />
                <h3 className={`font-semibold text-sm ${
                  isCurrent ? 'text-green-700' : isPassed ? 'text-gray-400' : 'text-gray-800'
                }`}>
                  {slot.start}–{slot.end}
                </h3>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  group.length > 0
                    ? isCurrent ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {group.length}
                </span>
                {slot.weight > 1 && (
                  <span className="text-[9px] text-gray-400">x{slot.weight}</span>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {group.map((c) => renderCard(c))}
                {isEmpty && (
                  <div className={`text-center py-6 text-xs ${
                    isPassed ? 'text-gray-300' : 'text-gray-400'
                  }`}>
                    Aucun prospect
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
