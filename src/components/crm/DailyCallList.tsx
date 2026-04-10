import { AlertTriangle, CalendarPlus } from 'lucide-react';
import { useCrmStore } from '../../store/useCrmStore';
import type { Contact } from '../../store/useCrmStore';
import { isToday, isPast, getTodayStr } from '../../utils/dateUtils';
import { CALL_SLOTS, getCurrentSlot } from '../../utils/callSlots';
import ContactCard from './ContactCard';

function getSlotForTime(time: string): string | null {
  if (!time) return null;
  for (const slot of CALL_SLOTS) {
    if (time === slot.start) return slot.id;
    if (time >= slot.start && time < slot.end) return slot.id;
  }
  return null;
}

export default function DailyCallList() {
  const { contacts, stages, scheduleUnscheduled } = useCrmStore();

  const todayStr = getTodayStr();
  const currentSlot = getCurrentSlot();
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const first3Stages = sortedStages.slice(0, 3);
  const first3StageIds = new Set(first3Stages.map((s) => s.id));

  const getStageInfo = (stageId: string) => {
    const idx = sortedStages.findIndex((s) => s.id === stageId);
    return { name: sortedStages[idx]?.name || '', index: idx };
  };

  // Prospects without a slot assignment in first 3 columns
  const unscheduledCount = contacts.filter(
    (c) => first3StageIds.has(c.stageId) && !c.callbackTime
  ).length;

  // Overdue: contacts with a past callbackDate
  const overdueContacts: Contact[] = [];

  // Slot groups: contacts from first 3 columns with a slot, no future callbackDate
  const slotGroups = new Map<string, Contact[]>();
  CALL_SLOTS.forEach((s) => slotGroups.set(s.id, []));

  contacts.forEach((c) => {
    // Hide already called today
    if (c.lastCalledDate === todayStr) return;

    // Overdue: has a past callbackDate
    if (c.callbackDate && isPast(c.callbackDate)) {
      overdueContacts.push(c);
      return;
    }

    // Skip contacts not in first 3 columns (unless they have a today callback)
    if (!first3StageIds.has(c.stageId)) {
      if (c.callbackDate && isToday(c.callbackDate) && c.callbackTime) {
        const slotId = getSlotForTime(c.callbackTime);
        if (slotId && slotGroups.has(slotId)) {
          slotGroups.get(slotId)!.push(c);
        }
      }
      return;
    }

    // Skip contacts with a future callbackDate (they have a specific scheduled date)
    if (c.callbackDate && !isToday(c.callbackDate)) return;

    // Must have a slot assigned
    if (!c.callbackTime) return;

    const slotId = getSlotForTime(c.callbackTime);
    if (slotId && slotGroups.has(slotId)) {
      slotGroups.get(slotId)!.push(c);
    }
  });

  overdueContacts.sort((a, b) => a.callbackDate.localeCompare(b.callbackDate));

  return (
    <div className="flex-1 overflow-x-auto p-4 sm:p-6">
      {/* Schedule button */}
      {unscheduledCount > 0 && (
        <div className="mb-3">
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
          <div className="w-72 flex flex-col bg-red-50 rounded-xl border-2 border-red-200 flex-shrink-0">
            <div className="flex items-center gap-2 p-3 border-b border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-sm text-red-700">En retard</h3>
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                {overdueContacts.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {overdueContacts.map((c) => {
                const info = getStageInfo(c.stageId);
                return (
                  <ContactCard
                    key={c.id}
                    contact={c}
                    stageName={info.name}
                    stageIndex={info.index}
                  />
                );
              })}
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
              className={`w-72 flex flex-col rounded-xl border-2 flex-shrink-0 transition-colors ${
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
                {group.map((c) => {
                  const info = getStageInfo(c.stageId);
                  return (
                    <ContactCard
                      key={c.id}
                      contact={c}
                      stageName={info.name}
                      stageIndex={info.index}
                    />
                  );
                })}
                {isEmpty && (
                  <div className={`text-center py-8 text-xs ${
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
