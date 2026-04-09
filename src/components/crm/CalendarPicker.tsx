import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateISO, getTodayStr, getTomorrowStr } from '../../utils/dateUtils';

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
  // 0=Mon, 6=Sun
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function CalendarPicker({ value, onChange }: CalendarPickerProps) {
  const today = new Date();
  const todayStr = getTodayStr();

  const [viewYear, setViewYear] = useState(() => {
    if (value) {
      return parseInt(value.split('-')[0]);
    }
    return today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      return parseInt(value.split('-')[1]);
    }
    return today.getMonth() + 1;
  });

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectDate = (day: number) => {
    onChange(formatDateISO(viewYear, viewMonth, day));
  };

  const oneWeekLater = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    onChange(formatDateISO(d.getFullYear(), d.getMonth() + 1, d.getDate()));
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white border rounded-lg p-3 w-full">
      {/* Quick buttons */}
      <div className="flex gap-1.5 mb-3">
        <button
          type="button"
          onClick={() => onChange(todayStr)}
          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
        >
          Aujourd'hui
        </button>
        <button
          type="button"
          onClick={() => onChange(getTomorrowStr())}
          className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
        >
          Demain
        </button>
        <button
          type="button"
          onClick={oneWeekLater}
          className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
        >
          +1 semaine
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {MONTHS_FR[viewMonth - 1]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_FR.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`e-${i}`} />;
          }
          const dateStr = formatDateISO(viewYear, viewMonth, day);
          const isSelected = dateStr === value;
          const isCurrentDay = dateStr === todayStr;

          return (
            <button
              key={day}
              type="button"
              onClick={() => selectDate(day)}
              className={`w-full aspect-square flex items-center justify-center text-xs rounded transition-colors ${
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
  );
}
