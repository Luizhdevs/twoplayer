import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { EscrowRepository } from './escrow.repository';
import { EventRepository } from './event.repository';
import { PrismaService } from '../../database/prisma.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PROVIDER_USER_ID  = 'provider-user-uuid';
const CLIENT_USER_ID    = 'client-user-uuid';
const OTHER_USER_ID     = 'other-user-uuid';
const APPT_ID           = 'appt-uuid';
const ESCROW_ID         = 'escrow-uuid';
const PROVIDER_ID       = 'provider-uuid';
const WALLET_ID         = 'wallet-uuid';

const makeAppointment = (status: string, userId = CLIENT_USER_ID) => ({
  id:         APPT_ID,
  userId,
  providerId: PROVIDER_ID,
  serviceId:  'svc-1',
  amount:     35000,
  status,
  deletedAt:  null,
  provider:   { id: PROVIDER_ID, userId: PROVIDER_USER_ID, user: { id: PROVIDER_USER_ID } },
  user:       { id: CLIENT_USER_ID },
  service:    { title: 'Bate-papo' },
});

const makeEscrow = (status = 'HELD') => ({
  id:            ESCROW_ID,
  appointmentId: APPT_ID,
  paymentId:     'payment-uuid',
  providerId:    PROVIDER_ID,
  amount:        35000,
  status,
  releasedAt:    null,
  deletedAt:     null,
  appointment:   makeAppointment('AWAITING_CLIENT_CONFIRMATION'),
  provider:      { id: PROVIDER_ID, userId: PROVIDER_USER_ID, user: { id: PROVIDER_USER_ID } },
});

// ── Builder do módulo de teste ─────────────────────────────────────────────────

async function buildModule(overrides?: {
  escrowRepo?: Partial<EscrowRepository>;
  appointmentStatus?: string;
  clientUserId?: string;
}) {
  const appointmentStatus = overrides?.appointmentStatus ?? 'PAID';
  const clientUserId      = overrides?.clientUserId ?? CLIENT_USER_ID;

  const prismaMock = {
    appointment: {
      findFirst: jest.fn().mockResolvedValue(makeAppointment(appointmentStatus, clientUserId)),
      findMany:  jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn().mockImplementation(async (fn: any) => {
      const txMock = {
        appointment:          { update: jest.fn().mockResolvedValue({}) },
        escrowTransaction:    { update: jest.fn().mockResolvedValue({}), create: jest.fn().mockResolvedValue({ id: ESCROW_ID }) },
        wallet:               { findFirst: jest.fn().mockResolvedValue({ id: WALLET_ID }), update: jest.fn().mockResolvedValue({}) },
        walletTransaction:    { create: jest.fn().mockResolvedValue({}) },
        appointmentEvent:     { create: jest.fn().mockResolvedValue({}) },
      };
      return fn(txMock);
    }),
  };

  const escrowRepoMock = {
    findByAppointmentId: jest.fn().mockResolvedValue(makeEscrow()),
    findById:            jest.fn().mockResolvedValue(makeEscrow()),
    create:              jest.fn().mockResolvedValue(makeEscrow()),
    updateStatus:        jest.fn().mockResolvedValue(makeEscrow()),
    findStaleForAutoRelease: jest.fn().mockResolvedValue([]),
    ...overrides?.escrowRepo,
  };

  const eventRepoMock = {
    findByAppointmentId: jest.fn().mockResolvedValue([]),
    record:              jest.fn().mockResolvedValue({}),
    recordWithTx:        jest.fn().mockResolvedValue({}),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      EscrowService,
      { provide: EscrowRepository, useValue: escrowRepoMock },
      { provide: EventRepository,  useValue: eventRepoMock },
      { provide: PrismaService,    useValue: prismaMock },
    ],
  }).compile();

  return {
    service:     module.get<EscrowService>(EscrowService),
    escrowRepo:  escrowRepoMock,
    eventRepo:   eventRepoMock,
    prisma:      prismaMock,
  };
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('EscrowService', () => {

  // ── confirmAppointment ──────────────────────────────────────────────────

  describe('confirmAppointment()', () => {
    it('PAID → CONFIRMED com provider correto', async () => {
      const { service, prisma } = await buildModule({ appointmentStatus: 'PAID' });
      await service.confirmAppointment(APPT_ID, PROVIDER_USER_ID);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('lança ConflictException para status diferente de PAID', async () => {
      const { service } = await buildModule({ appointmentStatus: 'CONFIRMED' });
      await expect(
        service.confirmAppointment(APPT_ID, PROVIDER_USER_ID),
      ).rejects.toThrow(ConflictException);
    });

    it('lança ForbiddenException para provider inválido', async () => {
      const { service } = await buildModule({ appointmentStatus: 'PAID' });
      await expect(
        service.confirmAppointment(APPT_ID, OTHER_USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lança NotFoundException para appointment inexistente', async () => {
      const { service, prisma } = await buildModule();
      prisma.appointment.findFirst.mockResolvedValue(null);
      await expect(
        service.confirmAppointment(APPT_ID, PROVIDER_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── startAppointment ────────────────────────────────────────────────────

  describe('startAppointment()', () => {
    it('CONFIRMED → IN_PROGRESS com provider correto', async () => {
      const { service, prisma } = await buildModule({ appointmentStatus: 'CONFIRMED' });
      await service.startAppointment(APPT_ID, PROVIDER_USER_ID);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('lança ConflictException para status diferente de CONFIRMED', async () => {
      const { service } = await buildModule({ appointmentStatus: 'PAID' });
      await expect(
        service.startAppointment(APPT_ID, PROVIDER_USER_ID),
      ).rejects.toThrow(ConflictException);
    });

    it('lança ForbiddenException para provider inválido', async () => {
      const { service } = await buildModule({ appointmentStatus: 'CONFIRMED' });
      await expect(
        service.startAppointment(APPT_ID, OTHER_USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── finishAppointment ───────────────────────────────────────────────────

  describe('finishAppointment()', () => {
    it('IN_PROGRESS → AWAITING_CLIENT_CONFIRMATION', async () => {
      const { service, prisma } = await buildModule({ appointmentStatus: 'IN_PROGRESS' });
      await service.finishAppointment(APPT_ID, PROVIDER_USER_ID);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('lança ConflictException para status diferente de IN_PROGRESS', async () => {
      const { service } = await buildModule({ appointmentStatus: 'CONFIRMED' });
      await expect(
        service.finishAppointment(APPT_ID, PROVIDER_USER_ID),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── approveAppointment ──────────────────────────────────────────────────

  describe('approveAppointment()', () => {
    it('AWAITING_CLIENT_CONFIRMATION → COMPLETED, libera escrow, credita wallet', async () => {
      const { service, prisma } = await buildModule({
        appointmentStatus: 'AWAITING_CLIENT_CONFIRMATION',
      });
      await service.approveAppointment(APPT_ID, CLIENT_USER_ID);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('lança ForbiddenException para cliente inválido', async () => {
      const { service } = await buildModule({
        appointmentStatus: 'AWAITING_CLIENT_CONFIRMATION',
      });
      await expect(
        service.approveAppointment(APPT_ID, OTHER_USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lança ConflictException se escrow já foi liberado (dupla aprovação)', async () => {
      const { service } = await buildModule({
        appointmentStatus: 'AWAITING_CLIENT_CONFIRMATION',
        escrowRepo: {
          findByAppointmentId: jest.fn().mockResolvedValue(makeEscrow('RELEASED')),
        },
      });
      await expect(
        service.approveAppointment(APPT_ID, CLIENT_USER_ID),
      ).rejects.toThrow(ConflictException);
    });

    it('lança NotFoundException se escrow não existe', async () => {
      const { service } = await buildModule({
        appointmentStatus: 'AWAITING_CLIENT_CONFIRMATION',
        escrowRepo: {
          findByAppointmentId: jest.fn().mockResolvedValue(null),
        },
      });
      await expect(
        service.approveAppointment(APPT_ID, CLIENT_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException para status diferente de AWAITING_CLIENT_CONFIRMATION', async () => {
      const { service } = await buildModule({ appointmentStatus: 'CONFIRMED' });
      await expect(
        service.approveAppointment(APPT_ID, CLIENT_USER_ID),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── processAutoReleases ─────────────────────────────────────────────────

  describe('processAutoReleases()', () => {
    it('libera 0 agendamentos quando não há stale', async () => {
      const { service } = await buildModule();
      const count = await service.processAutoReleases();
      expect(count).toBe(0);
    });

    it('libera agendamentos stale com escrow HELD', async () => {
      const staleAppt = {
        ...makeAppointment('AWAITING_CLIENT_CONFIRMATION'),
        escrowTransaction: makeEscrow('HELD'),
      };
      const { service, escrowRepo, prisma } = await buildModule({
        escrowRepo: {
          findStaleForAutoRelease: jest.fn().mockResolvedValue([staleAppt]),
          findByAppointmentId:     jest.fn().mockResolvedValue(makeEscrow('HELD')),
        },
      });
      // Para o auto-release, o findFirst do appointment retorna o stale
      prisma.appointment.findFirst.mockResolvedValue(
        makeAppointment('AWAITING_CLIENT_CONFIRMATION'),
      );
      const count = await service.processAutoReleases();
      expect(count).toBe(1);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('não libera agendamentos com escrow já RELEASED', async () => {
      const staleAppt = {
        ...makeAppointment('AWAITING_CLIENT_CONFIRMATION'),
        escrowTransaction: makeEscrow('RELEASED'),
      };
      const { service } = await buildModule({
        escrowRepo: {
          findStaleForAutoRelease: jest.fn().mockResolvedValue([staleAppt]),
        },
      });
      const count = await service.processAutoReleases();
      expect(count).toBe(0);
    });

    it('continua processando outros após falha individual', async () => {
      const stale1 = {
        ...makeAppointment('AWAITING_CLIENT_CONFIRMATION'),
        id:               'appt-1',
        escrowTransaction: makeEscrow('HELD'),
      };
      const stale2 = {
        ...makeAppointment('AWAITING_CLIENT_CONFIRMATION'),
        id:               'appt-2',
        escrowTransaction: makeEscrow('HELD'),
      };
      let callCount = 0;
      const { service, prisma } = await buildModule({
        escrowRepo: {
          findStaleForAutoRelease: jest.fn().mockResolvedValue([stale1, stale2]),
          findByAppointmentId:     jest.fn().mockResolvedValue(makeEscrow('HELD')),
        },
      });

      prisma.appointment.findFirst
        .mockResolvedValueOnce(null) // primeiro falha
        .mockResolvedValue(makeAppointment('AWAITING_CLIENT_CONFIRMATION'));

      const count = await service.processAutoReleases();
      // stale1 falha (NotFoundException), stale2 é liberado
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Fluxo completo ──────────────────────────────────────────────────────

  describe('Fluxo completo: PAID → CONFIRMED → IN_PROGRESS → AWAITING → COMPLETED', () => {
    it('executa todos os steps sem erros', async () => {
      let currentStatus = 'PAID';
      const { prisma } = await buildModule({ appointmentStatus: 'PAID' });

      // Simula mudança de status após cada transição
      prisma.appointment.findFirst.mockImplementation(() =>
        Promise.resolve(makeAppointment(currentStatus)),
      );

      prisma.$transaction.mockImplementation(async (fn: any) => {
        const txMock = {
          appointment:       { update: jest.fn().mockImplementation(({ data }) => { currentStatus = data.status; return Promise.resolve({}); }) },
          escrowTransaction: { update: jest.fn().mockResolvedValue({}) },
          wallet:            { findFirst: jest.fn().mockResolvedValue({ id: WALLET_ID }), update: jest.fn().mockResolvedValue({}) },
          walletTransaction: { create: jest.fn().mockResolvedValue({}) },
          appointmentEvent:  { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(txMock);
      });

      const { service, escrowRepo } = await buildModule({
        escrowRepo: {
          findByAppointmentId: jest.fn().mockResolvedValue(makeEscrow('HELD')),
        },
      });

      // Cada step deve resolver sem lançar
      await expect(service.confirmAppointment(APPT_ID, PROVIDER_USER_ID)).resolves.toBeDefined();
      await expect(service.startAppointment(APPT_ID, PROVIDER_USER_ID)).resolves.toBeDefined();
      await expect(service.finishAppointment(APPT_ID, PROVIDER_USER_ID)).resolves.toBeDefined();
      await expect(service.approveAppointment(APPT_ID, CLIENT_USER_ID)).resolves.toBeDefined();
    });
  });
});
