import { getNextWorkdayStr } from './dateUtils';
import type { Contact, PipelineStage } from '../store/useCrmStore';

export interface CallSlot {
  id: string;
  start: string; // "09:00"
  end: string;   // "09:30"
  label: string; // "9h"
  hour: number;  // 9
  min: number;   // 0
  endHour: number; // decimal end hour for fermeture check
  weight: number;  // relative capacity (slot 4 = 2, others = 1)
}

export const CALL_SLOTS: CallSlot[] = [
  { id: 's1', start: '09:00', end: '09:30', label: '9h', hour: 9, min: 0, endHour: 9.5, weight: 1 },
  { id: 's2', start: '11:30', end: '12:00', label: '11h30', hour: 11, min: 30, endHour: 12, weight: 1 },
  { id: 's3', start: '14:00', end: '14:30', label: '14h', hour: 14, min: 0, endHour: 14.5, weight: 1 },
  { id: 's4', start: '17:00', end: '18:00', label: '17h', hour: 17, min: 0, endHour: 18, weight: 2 },
  { id: 's5', start: '18:00', end: '18:30', label: '18h', hour: 18, min: 0, endHour: 18.5, weight: 1 },
  { id: 's6', start: '18:30', end: '19:00', label: '18h30', hour: 18, min: 30, endHour: 19, weight: 1 },
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

/** Returns the slot that is currently active, or null */
export function getCurrentSlot(): CallSlot | null {
  const now = new Date();
  const current = now.getHours() + now.getMinutes() / 60;
  return CALL_SLOTS.find((s) => {
    const start = s.hour + s.min / 60;
    return current >= start && current < s.endHour;
  }) || null;
}

/** Suggest the best next slot for the next working day (first valid slot) */
export function suggestNextSlot(fermeture: string): CallSlot | null {
  const closing = parseFermeture(fermeture);
  for (const slot of CALL_SLOTS) {
    if (slot.hour + slot.min / 60 < closing) return slot;
  }
  return null;
}

/**
 * Pick the best slot using weighted load balancing.
 * Slot 4 (17h-18h, weight=2) should get ~2x more prospects than weight=1 slots.
 */
export function assignBestSlot(
  fermeture: string,
  contacts: Contact[],
  targetDate?: string,
): CallSlot | null {
  const validSlots = getValidSlots(fermeture);
  if (validSlots.length === 0) return null;

  const date = targetDate || getNextWorkdayStr();

  // Count prospects already assigned to each slot on the target date
  const slotCounts = new Map<string, number>();
  validSlots.forEach((s) => slotCounts.set(s.start, 0));

  contacts.forEach((c) => {
    if (c.callbackDate === date && c.callbackTime) {
      const current = slotCounts.get(c.callbackTime);
      if (current !== undefined) {
        slotCounts.set(c.callbackTime, current + 1);
      }
    }
  });

  // Pick the slot that is most "under-filled" relative to its weight share
  // Metric: count / weight → lower means more room proportionally
  let best = validSlots[0];
  let bestRatio = (slotCounts.get(best.start) ?? 0) / best.weight;

  for (const slot of validSlots) {
    const count = slotCounts.get(slot.start) ?? 0;
    const ratio = count / slot.weight;
    if (ratio < bestRatio) {
      best = slot;
      bestRatio = ratio;
    }
  }

  return best;
}

/**
 * Schedule all unscheduled prospects from the first 3 pipeline columns.
 * Returns array of { contactId, callbackDate, callbackTime } updates.
 */
export function scheduleAllUnscheduled(
  contacts: Contact[],
  stages: PipelineStage[],
): { id: string; callbackDate: string; callbackTime: string }[] {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const first3Stages = sortedStages.slice(0, 3);
  const first3StageIds = new Set(first3Stages.map((s) => s.id));
  const gatekeeperStageIds = new Set(
    first3Stages.filter((s) => s.name.toLowerCase().includes('gatekeeper')).map((s) => s.id)
  );

  const targetDate = getNextWorkdayStr();
  const updates: { id: string; callbackDate: string; callbackTime: string }[] = [];

  // Get unscheduled contacts in first 3 columns (excluding gatekeeper)
  const unscheduled = contacts.filter(
    (c) => first3StageIds.has(c.stageId) && !gatekeeperStageIds.has(c.stageId) && !c.callbackDate
  );

  // Build a virtual contacts list that includes already-scheduled + our new assignments
  // so each new assignment considers the previous ones
  const virtualContacts = [...contacts];

  for (const contact of unscheduled) {
    const slot = assignBestSlot(contact.fermeture, virtualContacts, targetDate);
    if (slot) {
      updates.push({ id: contact.id, callbackDate: targetDate, callbackTime: slot.start });
      // Add virtual entry so next iteration sees this assignment
      virtualContacts.push({
        ...contact,
        callbackDate: targetDate,
        callbackTime: slot.start,
      });
    }
  }

  return updates;
}
