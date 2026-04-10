import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getNextWorkdayStr, formatDateFr } from '../../utils/dateUtils';
import { CALL_SLOTS, getValidSlots, suggestNextSlot } from '../../utils/callSlots';

interface CallTimeSuggestionProps {
  fermeture: string;
  onAccept: (date: string, time: string) => void;
  onDismiss: () => void;
}

export default function CallTimeSuggestion({ fermeture, onAccept, onDismiss }: CallTimeSuggestionProps) {
  const ref = useRef<HTMLDivElement>(null);

  const validSlots = getValidSlots(fermeture);
  const suggested = suggestNextSlot(fermeture);
  const dateStr = getNextWorkdayStr();

  // Auto-dismiss after 8s
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onDismiss]);

  const handleSelect = (time: string) => {
    onAccept(dateStr, time);
  };

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-xl p-2 min-w-[240px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium text-gray-500">
          Rappel → {formatDateFr(dateStr)}
        </span>
        <button onClick={onDismiss} className="p-0.5 hover:bg-gray-100 rounded">
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {/* Slot buttons */}
      <div className="grid grid-cols-3 gap-1">
        {CALL_SLOTS.map((slot) => {
          const isValid = validSlots.some((v) => v.id === slot.id);
          const isSuggested = suggested?.id === slot.id;

          return (
            <button
              key={slot.id}
              onClick={() => isValid && handleSelect(slot.start)}
              disabled={!isValid}
              className={`px-1.5 py-1.5 rounded text-xs font-medium transition-all ${
                !isValid
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                  : isSuggested
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                    : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
              title={!isValid ? `Fermé avant ${slot.label}` : `Rappeler à ${slot.label}`}
            >
              {slot.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
