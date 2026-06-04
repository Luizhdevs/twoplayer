import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { AvailabilityRepository } from './availability.repository';
import { BlockRepository } from './block.repository';
import { PrismaService } from '../../database/prisma.service';
import {
  MIN_BOOKING_NOTICE_HOURS,
  MAX_BOOKING_DAYS_AHEAD,
} from './availability.constants';

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONDAY = 1;
const SUNDAY = 0;

/** Cria um Date UTC com antecedência segura (3h à frente) no próximo Xxxx-feira */
function futureMonday(hoursAhead = MIN_BOOKING_NOTICE_HOURS + 1): Date {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() + hoursAhead, 0, 0, 0);
  // Ajusta para segunda-feira
  while (d.getUTCDay() !== MONDAY) d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(10, 0, 0, 0); // 10:00 UTC
  return d;
}

/** Retorna a string YYYY-MM-DD de um Date */
function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

const mockAvailabilityMonday = {
  id: 'av-1',
  providerId: 'prov-1',
  weekday: MONDAY,
  startTime: '08:00',
  endTime: '18:00',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let availabilityRepo: jest.Mocked<AvailabilityRepository>;
  let blockRepo: jest.Mocked<BlockRepository>;
  let prisma: { appointment: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { appointment: { findMany: jest.fn().mockResolvedValue([]) } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: AvailabilityRepository,
          useValue: {
            findByProvider:            jest.fn().mockResolvedValue([]),
            findByProviderAndWeekday:  jest.fn().mockResolvedValue(null),
            replaceAll:                jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: BlockRepository,
          useValue: {
            findByProvider:     jest.fn().mockResolvedValue([]),
            findById:           jest.fn().mockResolvedValue(null),
            findByProviderAndDate: jest.fn().mockResolvedValue([]),
            findBlockAtTime:    jest.fn().mockResolvedValue(null),
            create:             jest.fn(),
            softDelete:         jest.fn(),
          },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service          = module.get<AvailabilityService>(AvailabilityService);
    availabilityRepo = module.get(AvailabilityRepository);
    blockRepo        = module.get(BlockRepository);
  });

  // ── getAvailableSlots ────────────────────────────────────────────────────

  describe('getAvailableSlots()', () => {
    it('retorna array vazio quando provider não trabalha naquele dia', async () => {
      (availabilityRepo.findByProviderAndWeekday as jest.Mock).mockResolvedValue(null);
      const date = toDateStr(futureMonday());
      const slots = await service.getAvailableSlots('prov-1', date);
      expect(slots).toEqual([]);
    });

    it('retorna slots livres para dia com disponibilidade', async () => {
      (availabilityRepo.findByProviderAndWeekday as jest.Mock)
        .mockResolvedValue(mockAvailabilityMonday);

      const mon = futureMonday();
      const slots = await service.getAvailableSlots('prov-1', toDateStr(mon));

      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThan(0);
      slots.forEach((s) => expect(s).toMatch(/^\d{2}:\d{2}$/));
    });

    it('remove slots já agendados', async () => {
      (availabilityRepo.findByProviderAndWeekday as jest.Mock)
        .mockResolvedValue(mockAvailabilityMonday);

      const mon = futureMonday();
      // Simula appointment às 14:00 UTC
      const bookedAt = new Date(`${toDateStr(mon)}T14:00:00.000Z`);
      prisma.appointment.findMany.mockResolvedValue([{ scheduledAt: bookedAt }]);

      const slots = await service.getAvailableSlots('prov-1', toDateStr(mon));
      expect(slots).not.toContain('14:00');
    });

    it('remove slots dentro de um bloco', async () => {
      (availabilityRepo.findByProviderAndWeekday as jest.Mock)
        .mockResolvedValue(mockAvailabilityMonday);

      const mon = futureMonday();
      const dateStr = toDateStr(mon);
      const blockStart = new Date(`${dateStr}T10:00:00.000Z`);
      const blockEnd   = new Date(`${dateStr}T13:00:00.000Z`);
      (blockRepo.findByProviderAndDate as jest.Mock).mockResolvedValue([
        { startDatetime: blockStart, endDatetime: blockEnd },
      ]);

      const slots = await service.getAvailableSlots('prov-1', dateStr);
      expect(slots).not.toContain('10:00');
      expect(slots).not.toContain('11:00');
      expect(slots).not.toContain('12:00');
    });

    it('lança BadRequestException para data com formato inválido', async () => {
      await expect(
        service.getAvailableSlots('prov-1', 'data-invalida'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── validateBooking ──────────────────────────────────────────────────────

  describe('validateBooking()', () => {
    it('deve aceitar agendamento válido (disponível, sem bloqueio)', async () => {
      (availabilityRepo.findByProviderAndWeekday as jest.Mock)
        .mockResolvedValue(mockAvailabilityMonday);
      const scheduledAt = futureMonday();
      await expect(
        service.validateBooking('prov-1', scheduledAt),
      ).resolves.toBeUndefined();
    });

    it('lança BadRequestException por antecedência insuficiente', async () => {
      const scheduledAt = new Date(
        Date.now() + (MIN_BOOKING_NOTICE_HOURS - 1) * 60 * 60 * 1000,
      );
      await expect(
        service.validateBooking('prov-1', scheduledAt),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException por data além de MAX_BOOKING_DAYS_AHEAD', async () => {
      const scheduledAt = new Date(
        Date.now() + (MAX_BOOKING_DAYS_AHEAD + 1) * 24 * 60 * 60 * 1000,
      );
      await expect(
        service.validateBooking('prov-1', scheduledAt),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança ConflictException quando provider não trabalha naquele dia', async () => {
      (availabilityRepo.findByProviderAndWeekday as jest.Mock).mockResolvedValue(null);
      const scheduledAt = futureMonday();
      await expect(
        service.validateBooking('prov-1', scheduledAt),
      ).rejects.toThrow(ConflictException);
    });

    it('lança ConflictException quando horário está fora da janela', async () => {
      // Disponibilidade: 08:00-12:00; slot: 14:00
      (availabilityRepo.findByProviderAndWeekday as jest.Mock).mockResolvedValue({
        ...mockAvailabilityMonday,
        endTime: '12:00',
      });
      const mon = futureMonday();
      mon.setUTCHours(14, 0, 0, 0);
      await expect(
        service.validateBooking('prov-1', mon),
      ).rejects.toThrow(ConflictException);
    });

    it('lança ConflictException quando horário está bloqueado', async () => {
      (availabilityRepo.findByProviderAndWeekday as jest.Mock)
        .mockResolvedValue(mockAvailabilityMonday);
      (blockRepo.findBlockAtTime as jest.Mock).mockResolvedValue({
        id: 'blk-1',
        reason: 'Férias',
      });
      const scheduledAt = futureMonday();
      await expect(
        service.validateBooking('prov-1', scheduledAt),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── setAvailability ──────────────────────────────────────────────────────

  describe('setAvailability()', () => {
    it('rejeita weekdays duplicados', async () => {
      await expect(
        service.setAvailability('prov-1', {
          schedule: [
            { weekday: 1, startTime: '08:00', endTime: '18:00' },
            { weekday: 1, startTime: '09:00', endTime: '17:00' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita startTime >= endTime', async () => {
      await expect(
        service.setAvailability('prov-1', {
          schedule: [{ weekday: 2, startTime: '18:00', endTime: '08:00' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('aceita schedule válida e chama replaceAll', async () => {
      (availabilityRepo.findByProvider as jest.Mock).mockResolvedValue([mockAvailabilityMonday]);
      await service.setAvailability('prov-1', {
        schedule: [{ weekday: 1, startTime: '08:00', endTime: '18:00' }],
      });
      expect(availabilityRepo.replaceAll).toHaveBeenCalledWith('prov-1', expect.any(Array));
    });
  });

  // ── createBlock ──────────────────────────────────────────────────────────

  describe('createBlock()', () => {
    it('lança BadRequestException quando endDateTime <= startDateTime', async () => {
      await expect(
        service.createBlock('prov-1', {
          startDateTime: '2027-01-10T08:00:00Z',
          endDateTime:   '2027-01-10T08:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException quando startDateTime é no passado', async () => {
      await expect(
        service.createBlock('prov-1', {
          startDateTime: '2020-01-01T08:00:00Z',
          endDateTime:   '2020-01-02T08:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('cria bloco com dados válidos', async () => {
      (blockRepo.create as jest.Mock).mockResolvedValue({ id: 'blk-new' });
      const result = await service.createBlock('prov-1', {
        startDateTime: '2027-07-10T08:00:00Z',
        endDateTime:   '2027-07-15T18:00:00Z',
        reason:        'Férias',
      });
      expect(blockRepo.create).toHaveBeenCalledWith('prov-1', expect.any(Object));
    });
  });

  // ── removeBlock ──────────────────────────────────────────────────────────

  describe('removeBlock()', () => {
    it('lança NotFoundException se bloco não existe', async () => {
      (blockRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(
        service.removeBlock('blk-x', 'prov-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança ForbiddenException se não é o dono', async () => {
      (blockRepo.findById as jest.Mock).mockResolvedValue({
        id: 'blk-1',
        providerId: 'outro-prov',
      });
      await expect(
        service.removeBlock('blk-1', 'prov-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('remove bloco do dono sem erros', async () => {
      (blockRepo.findById as jest.Mock).mockResolvedValue({
        id: 'blk-1',
        providerId: 'prov-1',
      });
      (blockRepo.softDelete as jest.Mock).mockResolvedValue({});
      await expect(
        service.removeBlock('blk-1', 'prov-1'),
      ).resolves.toBeDefined();
    });
  });
});
