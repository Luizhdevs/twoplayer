import {
  buildSlotDatetime,
  extractTimeUTC,
  generateSlots,
  minutesToTime,
  timeToMinutes,
} from './slot-generator';

describe('SlotGenerator — funções puras', () => {
  describe('timeToMinutes()', () => {
    it('converte "08:00" → 480', () => expect(timeToMinutes('08:00')).toBe(480));
    it('converte "18:30" → 1110', () => expect(timeToMinutes('18:30')).toBe(1110));
    it('converte "00:00" → 0', () => expect(timeToMinutes('00:00')).toBe(0));
    it('converte "23:59" → 1439', () => expect(timeToMinutes('23:59')).toBe(1439));
  });

  describe('minutesToTime()', () => {
    it('converte 480 → "08:00"', () => expect(minutesToTime(480)).toBe('08:00'));
    it('converte 0 → "00:00"', () => expect(minutesToTime(0)).toBe('00:00'));
    it('converte 90 → "01:30"', () => expect(minutesToTime(90)).toBe('01:30'));
  });

  describe('generateSlots()', () => {
    it('gera slots horários de 08:00 a 12:00', () => {
      expect(generateSlots('08:00', '12:00')).toEqual(['08:00', '09:00', '10:00', '11:00']);
    });

    it('retorna vazio se startTime === endTime', () => {
      expect(generateSlots('10:00', '10:00')).toEqual([]);
    });

    it('retorna vazio se startTime > endTime', () => {
      expect(generateSlots('18:00', '08:00')).toEqual([]);
    });

    it('gera slot único para janela de exatamente 60 min', () => {
      expect(generateSlots('14:00', '15:00')).toEqual(['14:00']);
    });

    it('gera 10 slots de 08:00 a 18:00', () => {
      expect(generateSlots('08:00', '18:00')).toHaveLength(10);
    });

    it('não inclui o slot de endTime', () => {
      const slots = generateSlots('08:00', '09:00');
      expect(slots).not.toContain('09:00');
    });
  });

  describe('buildSlotDatetime()', () => {
    it('constrói Date UTC corretamente', () => {
      const dt = buildSlotDatetime('2026-07-20', '14:00');
      expect(dt.toISOString()).toBe('2026-07-20T14:00:00.000Z');
    });
  });

  describe('extractTimeUTC()', () => {
    it('extrai "HH:mm" de um Date UTC', () => {
      const dt = new Date('2026-07-20T09:30:00.000Z');
      expect(extractTimeUTC(dt)).toBe('09:30');
    });
  });
});
