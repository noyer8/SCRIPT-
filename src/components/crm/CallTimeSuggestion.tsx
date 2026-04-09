import { useState, useEffect } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { getTodayStr, getTomorrowStr } from '../../utils/dateUtils';

// User's cold call time slots
const CALL_SLOTS = [
  { start: 9, startMin: 0, end: 9, endMin: 30, label: '9h00' },
  { start: 11, startMin: 30, end: 12, endMin: 0, label: '11h30' },
  { start: 14, startMin: 0, end: 14, endMin: 30, label: '14h00' },
  { start: 17, startMin: 0, end: 19, endMin: 0, label: '17h00' },
];

function parseFermeture(fermeture: string): number {
  if (!fermeture) return 19;
  if (fermeture === '18:30') return 18.5;
  return parseFloat(fermeture) || 19;
}

function getCurrentSlotIndex(): number {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const current = h + m / 60;

  for (let i = 0; i < CALL_SLOTS.length; i++) {
    const slot = CALL_SLOTS[i];
    const slotStart = slot.start + slot.startMin / 60;
    const slotEnd = slot.end + slot.endMin / 60;
    if (current >= slotStart && current < slotEnd) return i;
  }
  return -1;
}

function getNextAvailableSlot(fermeture: string): { time: string; label: string; tomorrow: boolean } | null {
  const closingHour = parseFermeture(fermeture);
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const current = h + m / 60;
  const currentSlotIdx = getCurrentSlotIndex();

  // Try slots after the current one today
  for (let i = 0; i < CALL_SLOTS.length; i++) {
    const slot = CALL_SLOTS[i];
    const slotStart = slot.start + slot.startMin / 60;

    // Skip slots that have already started or are the current slot
    if (slotStart <= current) continue;
    if (i === currentSlotIdx) continue;

    // Skip slots past closing time
    if (slotStart >= closingHour) continue;

    const timeStr = `${String(slot.start).padStart(2, '0')}:${String(slot.startMin).padStart(2, '0')}`;
    return { time: timeStr, label: slot.label, tomorrow: false };
  }

  // All slots today are done, suggest first slot tomorrow
  for (const slot of CALL_SLOTS) {
    const slotStart = slot.start + slot.startMin / 60;
    if (slotStart >= closingHour) continue;

    const timeStr = `${String(slot.start).padStart(2, '0')}:${String(slot.startMin).padStart(2, '0')}`;
    return { time: timeStr, label: slot.label, tomorrow: true };
  }

  return null;
}

interface CallTimeSuggestionProps {
  fermeture: string;
  onAccept: (date: string, time: string) => void;
  onDismiss: () => void;
}

export default function CallTimeSuggestion({ fermeture, onAccept, onDismiss }: CallTimeSuggestionProps) {
  const [visible, setVisible] = useState(true);
  const suggestion = getNextAvailableSlot(fermeture);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible || !suggestion) return null;

  const dateStr = suggestion.tomorrow ? getTomorrowStr() : getTodayStr();
  const dayLabel = suggestion.tomorrow ? 'demain' : "aujourd'hui";

  return (
    <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-blue-200 rounded-lg shadow-lg p-2 min-w-[200px] animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Clock className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-xs font-medium text-gray-700">
          Rappeler {dayLabel} à {suggestion.label}
        </span>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => {
            onAccept(dateStr, suggestion.time);
            setVisible(false);
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Check className="w-3 h-3" />
          OK
        </button>
        <button
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
