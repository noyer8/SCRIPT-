import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { formatDateISO, formatDateFr, getTodayStr, getTomorrowStr } from '../../utils/dateUtils';

interface CalendarPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

const DAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function CalendarPicker({ value, onChange }: CalendarPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const todayStr = getTodayStr();

  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split('-')[0]);
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return parseInt(value.split('-')[1]);
    return new Date().getMonth() + 1;
  });

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      setViewYear(parseInt(value.split('-')[0]));
      setViewMonth(parseInt(value.split('-')[1]));
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDate = (day: number) => {
    onChange(formatDateISO(viewYear, viewMonth, day));
    setOpen(false);
  };

  const oneWeekLater = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    onChange(formatDateISO(d.getFullYear(), d.getMonth() + 1, d.getDate()));
    setOpen(false);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger: date display */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 transition-colors w-full"
      >
        <CalendarClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {value ? (
          <span className="text-gray-800">{formatDateFr(value)}</span>
        ) : (
          <span className="text-gray-400">Choisir une date...</span>
        )}
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border rounded-lg shadow-xl p-2.5 w-64">
          {/* Quick buttons */}
          <div className="flex gap-1 mb-2">
            <button
              type="button"
              onClick={() => { onChange(todayStr); setOpen(false); }}
              className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => { onChange(getTomorrowStr()); setOpen(false); }}
              className="px-2 py-0.5 text-[11px] bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
            >
              Demain
            </button>
            <button
              type="button"
              onClick={oneWeekLater}
              className="px-2 py-0.5 text-[11px] bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
            >
              +1 sem.
            </button>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-1.5">
            <button type="button" onClick={prevMonth} className="p-0.5 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <span className="text-xs font-medium text-gray-700">
              {MONTHS_FR[viewMonth - 1]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-0.5 hover:bg-gray-100 rounded">
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {DAYS_FR.map((d) => (
              <div key={d} className="text-center text-[9px] font-medium text-gray-400 py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const dateStr = formatDateISO(viewYear, viewMonth, day);
              const isSelected = dateStr === value;
              const isCurrentDay = dateStr === todayStr;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={`w-full aspect-square flex items-center justify-center text-[11px] rounded transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold'
                      : isCurrentDay
                        ? 'bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-300'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
