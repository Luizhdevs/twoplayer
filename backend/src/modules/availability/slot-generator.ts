import { SLOT_DURATION_MINUTES } from './availability.constants';

/**
 * Converte "HH:mm" → total de minutos desde meia-noite.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Converte minutos → "HH:mm".
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Gera todos os slots (HH:mm) entre startTime e endTime
 * com intervalos de SLOT_DURATION_MINUTES.
 *
 * Ex: startTime="08:00", endTime="12:00" → ["08:00","09:00","10:00","11:00"]
 */
export function generateSlots(startTime: string, endTime: string): string[] {
  const start = timeToMinutes(startTime);
  const end   = timeToMinutes(endTime);
  const slots: string[] = [];

  for (let min = start; min + SLOT_DURATION_MINUTES <= end; min += SLOT_DURATION_MINUTES) {
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
