import { SLOT_DURATION_MINUTES } from './availability.constants';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateSlots(
  startTime: string,
  endTime: string,
  durationMinutes = SLOT_DURATION_MINUTES,
): string[] {
  const start = timeToMinutes(startTime);
  const end   = timeToMinutes(endTime);
  const slots: string[] = [];
  const step = Math.max(durationMinutes, 15); // mínimo 15min por segurança

  for (let min = start; min + step <= end; min += step) {
    slots.push(minutesToTime(min));
  }

  return slots;
}

/**
 * Constrói um Date UTC a partir de uma data (YYYY-MM-DD) + hora (HH:mm).
 */
export function buildSlotDatetime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00.000Z`);
}

/**
 * Extrai "HH:mm" de um Date UTC.
 */
export function extractTimeUTC(date: Date): string {
  return date.toISOString().substring(11, 16);
}
