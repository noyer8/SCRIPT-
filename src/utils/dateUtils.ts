export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
}

export function isPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  return date < today;
}

export function isFuture(dateStr: string): boolean {
  if (!dateStr) return false;
  return !isToday(dateStr) && !isPast(dateStr);
}

export function formatDateFr(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Returns the next working day (Mon-Fri) as YYYY-MM-DD */
export function getNextWorkdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  // Skip weekends: 6=Saturday, 0=Sunday
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
