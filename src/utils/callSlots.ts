import { getTodayStr } from './dateUtils';
import type { Contact } from '../store/useCrmStore';

export interface CallSlot {
  id: string;
  start: string; // "09:00"
  end: string;   // "09:30"
  label: string; // "9h"
  hour: number;  // 9
  min: number;   // 0
  endHour: number; // for fermeture check
}

export const CALL_SLOTS: CallSlot[] = [
  { id: 's1', start: '09:00', end: '09:30', label: '9h', hour: 9, min: 0, endHour: 9.5 },
  { id: 's2', start: '11:30', end: '12:00', label: '11h30', hour: 11, min: 30, endHour: 12 },
  { id: 's3', start: '14:00', end: '14:30', label: '14h', hour: 14, min: 0, endHour: 14.5 },
  { id: 's4', start: '17:00', end: '18:00', label: '17h', hour: 17, min: 0, endHour: 18 },
  { id: 's5', start: '18:00', end: '18:30', label: '18h', hour: 18, min: 0, endHour: 18.5 },
  { id: 's6', start: '18:30', end: '19:00', label: '18h30', hour: 18, min: 30, endHour: 19 },
];

export function parseFermeture(fermeture: string): number {
  if (!fermeture) return 19;
  if (fermeture === '18:30') return 18.5;
  return parseFloat(fermeture) || 19;
}

/** Returns which slots are valid given a prospect's fermeture */
export function getValidSlots(fermeture: string): CallSlot[] {
  const closing = parseFermeture(fermeture);
  return CALL_SLOTS.filter((s) => s.hour + s.min / 60 < closing);
}

/** Returns the slot that is currently active (we're in it right now), or null */
export function getCurrentSlot(): CallSlot | null {
  const now = new Date();
  const current = now.getHours() + now.getMinutes() / 60;
  return CALL_SLOTS.find((s) => {
    const start = s.hour + s.min / 60;
    return current >= start && current < s.endHour;
  }) || null;
}

/** Suggest the best next slot (not the current one, respecting fermeture) */
export function suggestNextSlot(fermeture: string): CallSlot | null {
  const closing = parseFermeture(fermeture);
  const now = new Date();
  const current = now.getHours() + now.getMinutes() / 60;
  const currentSlot = getCurrentSlot();

  // Try future slots today
  for (const slot of CALL_SLOTS) {
    const start = slot.hour + slot.min / 60;
    if (start < closing && start > current && slot.id !== currentSlot?.id) {
      return slot;
    }
  }

  // All today's slots done → first valid slot (for tomorrow)
  for (const slot of CALL_SLOTS) {
    const start = slot.hour + slot.min / 60;
    if (start < closing) return slot;
  }

  return null;
}

/** Pick the best slot for a new prospect based on fermeture + load balancing */
export function assignBestSlot(fermeture: string, contacts: Contact[]): CallSlot | null {
  const validSlots = getValidSlots(fermeture);
  if (validSlots.length === 0) return null;

  const todayStr = getTodayStr();

  // Count how many prospects are assigned to each slot today
  const slotCounts = new Map<string, number>();
  validSlots.forEach((s) => slotCounts.set(s.start, 0));

  contacts.forEach((c) => {
    if (c.callbackDate === todayStr && c.callbackTime) {
      const current = slotCounts.get(c.callbackTime);
      if (current !== undefined) {
        slotCounts.set(c.callbackTime, current + 1);
      }
    }
  });

  // Pick the valid slot with the least load
  let best = validSlots[0];
  let bestCount = slotCounts.get(best.start) ?? 0;

  for (const slot of validSlots) {
    const count = slotCounts.get(slot.start) ?? 0;
    if (count < bestCount) {
      best = slot;
      bestCount = count;
    }
  }

  return best;
}
