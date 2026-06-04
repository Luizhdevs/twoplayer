/** Antecedência mínima para agendamento (horas) */
export const MIN_BOOKING_NOTICE_HOURS = 2;

/** Janela máxima de agendamento futuro (dias) */
export const MAX_BOOKING_DAYS_AHEAD = 90;

/** Duração de cada slot (minutos) */
export const SLOT_DURATION_MINUTES = 60;

/** Nomes dos dias da semana para mensagens de erro */
export const WEEKDAY_NAMES: Record<number, string> = {
  0: 'domingo',
  1: 'segunda-feira',
  2: 'terça-feira',
  3: 'quarta-feira',
  4: 'quinta-feira',
  5: 'sexta-feira',
  6: 'sábado',
};

/** Regex para validar formato HH:mm */
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
