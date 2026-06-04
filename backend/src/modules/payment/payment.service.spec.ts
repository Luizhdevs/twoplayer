import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { AppointmentRepository } from '../appointment/appointment.repository';
import { MercadoPagoService } from '../../mercadopago/mercadopago.service';
import { PrismaService } from '../../database/prisma.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const USER_ID       = 'user-db-uuid';
const OTHER_USER_ID = 'other-user-uuid';
const APPT_ID       = 'appt-uuid';
const PAYMENT_ID    = 'payment-uuid';
const PREF_ID       = 'pref-id-123';
const MP_PAYMENT_ID = '987654321';

const mockAppointment = {
  id:         APPT_ID,
  userId:     USER_ID,
  providerId: 'prov-1',
  serviceId:  'svc-1',
  amount:     35000,
  status:     'PENDING_PAYMENT',
  scheduledAt: new Date('2027-01-15T14:00:00Z'),
  provider:   { user: { name: 'Neymar Jr', email: 'neymar@test.com' } },
  user:       { email: 'fan@test.com' },
  service:    { title: 'Bate-papo' },
};

const mockPayment = {
  id:            PAYMENT_ID,
  appointmentId: APPT_ID,
  externalId:    PREF_ID,
  status:        'PENDING' as const,
  amount:        35000,
  currency:      'BRL',
  paymentMethod: null,
  paidAt:        null,
};

const mockMpPreference = {
  preferenceId:     PREF_ID,
  initPoint:        'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
  sandboxInitPoint: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
};

const mockMpPaymentApproved = {
  id:               Number(MP_PAYMENT_ID),
  status:           'approved',
  statusDetail:     'accredited',
  externalReference: APPT_ID,
  paymentMethodId:  'credit_card',
  paymentTypeId:    'credit_card',
  transactionAmount: 350.00,
  dateApproved:     '2027-01-15T15:00:00Z',
  payer:            { email: 'fan@test.com' },
};

const mockMpPaymentRejected = { ...mockMpPaymentApproved, status: 'rejected', statusDetail: 'cc_rejected_insufficient_amount' };

// ── Helper para criar módulo de teste ─────────────────────────────────────────

async function buildModule(overrides?: {
  paymentRepo?:     Partial<PaymentRepository>;
  appointmentRepo?: Partial<AppointmentRepository>;
  mpService?:       Partial<MercadoPagoService>;
  prisma?:          Partial<PrismaService>;
}) {
  const paymentRepoMock = {
    findById:            jest.fn().mockResolvedValue(mockPayment),
    findByAppointmentId: jest.fn().mockResolvedValue(null),
    findByExternalId:    jest.fn().mockResolvedValue(null),
    create:              jest.fn().mockResolvedValue(mockPayment),
    updateStatus:        jest.fn().mockResolvedValue(mockPayment),
    ...overrides?.paymentRepo,
  };

  const apptRepoMock = {
    findById: jest.fn().mockResolvedValue(mockAppointment),
    ...overrides?.appointmentRepo,
  };

  const mpMock = {
    createPreference:        jest.fn().mockResolvedValue(mockMpPreference),
    getPayment:              jest.fn().mockResolvedValue(mockMpPaymentApproved),
    validateWebhookSignature: jest.fn().mockReturnValue(true),
    ...overrides?.mpService,
  };

  const prismaMock = {
    $transaction: jest.fn().mockImplementation(async (fn: any) => fn({
      payment:     { update: jest.fn().mockResolvedValue({}) },
      appointment: { update: jest.fn().mockResolvedValue({}) },
    })),
    ...overrides?.prisma,
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      PaymentService,
      { provide: PaymentRepository,     useValue: paymentRepoMock },
      { provide: AppointmentRepository, useValue: apptRepoMock },
      { provide: MercadoPagoService,    useValue: mpMock },
      { provide: PrismaService,         useValue: prismaMock },
    ],
  }).compile();

  return {
    service:         module.get<PaymentService>(PaymentService),
    paymentRepo:     paymentRepoMock,
    appointmentRepo: apptRepoMock,
    mpService:       mpMock,
    prisma:          prismaMock,
  };
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('PaymentService', () => {

  // ── createCheckout ────────────────────────────────────────────────────────

  describe('createCheckout()', () => {
    it('deve criar checkout para appointment PENDING_PAYMENT', async () => {
      const { service } = await buildModule();
      const result = await service.createCheckout(USER_ID, { appointmentId: APPT_ID });
      expect(result.checkoutUrl).toContain('mercadopago');
      expect(result.paymentId).toBe(PAYMENT_ID);
    });

    it('deve lançar NotFoundException para appointment inexistente', async () => {
      const { service } = await buildModule({
        appointmentRepo: { findById: jest.fn().mockResolvedValue(null) },
      });
      await expect(
        service.createCheckout(USER_ID, { appointmentId: APPT_ID }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException quando usuário não é o dono', async () => {
      const { service } = await buildModule();
      await expect(
        service.createCheckout(OTHER_USER_ID, { appointmentId: APPT_ID }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar BadRequestException para status diferente de PENDING_PAYMENT', async () => {
      const { service } = await buildModule({
        appointmentRepo: {
          findById: jest.fn().mockResolvedValue({ ...mockAppointment, status: 'PAID' }),
        },
      });
      await expect(
        service.createCheckout(USER_ID, { appointmentId: APPT_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve reutilizar checkout existente (idempotência)', async () => {
      const { service, paymentRepo, mpService } = await buildModule({
        paymentRepo: {
          findByAppointmentId: jest.fn().mockResolvedValue(mockPayment),
        },
      });
      const result = await service.createCheckout(USER_ID, { appointmentId: APPT_ID });
      expect(paymentRepo.create).not.toHaveBeenCalled();
      expect(result.checkoutUrl).toBeDefined();
    });

    it('deve chamar MP createPreference com dados corretos', async () => {
      const { service, mpService } = await buildModule();
      await service.createCheckout(USER_ID, { appointmentId: APPT_ID });
      expect(mpService.createPreference).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: APPT_ID,
          unitPrice:     350,
          quantity:      1,
        }),
      );
    });
  });

  // ── handleWebhook ─────────────────────────────────────────────────────────

  describe('handleWebhook()', () => {
    const validWebhookBody = {
      id:           12345,
      live_mode:    true,
      type:         'payment',
      date_created: '2027-01-15T15:00:00Z',
      action:       'payment.updated',
      data:         { id: MP_PAYMENT_ID },
    };

    it('deve aprovar pagamento e atualizar appointment para PAID', async () => {
      const { service, prisma } = await buildModule({
        paymentRepo: {
          findByAppointmentId: jest.fn().mockResolvedValue(mockPayment),
        },
      });

      const result = await service.handleWebhook('ts=1,v1=abc', 'req-1', validWebhookBody);
      expect(result.ok).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('deve rejeitar webhook com assinatura inválida', async () => {
      const { service } = await buildModule({
        mpService: { validateWebhookSignature: jest.fn().mockReturnValue(false) },
      });
      await expect(
        service.handleWebhook('invalid-sig', 'req-1', validWebhookBody),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve ignorar eventos que não são "payment"', async () => {
      const { service, prisma } = await buildModule();
      const result = await service.handleWebhook('ts=1,v1=abc', 'req-1', {
        ...validWebhookBody, type: 'subscription',
      });
      expect(result.ok).toBe(true);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('deve ser idempotente para webhook duplicado com status APPROVED', async () => {
      const { service, prisma } = await buildModule({
        paymentRepo: {
          findByAppointmentId: jest.fn().mockResolvedValue({
            ...mockPayment, status: 'APPROVED' as const,
          }),
        },
      });
      const result = await service.handleWebhook('ts=1,v1=abc', 'req-1', validWebhookBody);
      expect(result.ok).toBe(true);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('deve processar pagamento REJEITADO sem atualizar appointment para PAID', async () => {
      const { service, prisma } = await buildModule({
        paymentRepo: {
          findByAppointmentId: jest.fn().mockResolvedValue(mockPayment),
        },
        mpService: {
          validateWebhookSignature: jest.fn().mockReturnValue(true),
          getPayment: jest.fn().mockResolvedValue(mockMpPaymentRejected),
        },
      });
      const result = await service.handleWebhook('ts=1,v1=abc', 'req-1', validWebhookBody);
      expect(result.ok).toBe(true);
      // transaction é chamado para REJECTED mas appointment não muda para PAID
      const txFn = prisma.$transaction.mock.calls[0][0];
      const txMock = {
        payment:     { update: jest.fn().mockResolvedValue({}) },
        appointment: { update: jest.fn().mockResolvedValue({}) },
      };
      await txFn(txMock);
      expect(txMock.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED' }) }),
      );
      expect(txMock.appointment.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'PAID' } }),
      );
    });

    it('deve retornar ok=true quando payment não é encontrado internamente', async () => {
      const { service } = await buildModule({
        paymentRepo: {
          findByAppointmentId: jest.fn().mockResolvedValue(null),
        },
      });
      const result = await service.handleWebhook('ts=1,v1=abc', 'req-1', validWebhookBody);
      expect(result.ok).toBe(true);
    });

    it('deve retornar ok=true quando falha ao buscar pagamento no MP', async () => {
      const { service } = await buildModule({
        paymentRepo: {
          findByAppointmentId: jest.fn().mockResolvedValue(mockPayment),
        },
        mpService: {
          validateWebhookSignature: jest.fn().mockReturnValue(true),
          getPayment: jest.fn().mockRejectedValue(new Error('MP API error')),
        },
      });
      const result = await service.handleWebhook('ts=1,v1=abc', 'req-1', validWebhookBody);
      expect(result.ok).toBe(true);
    });
  });

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('retorna payment existente', async () => {
      const { service } = await buildModule();
      const result = await service.findById(PAYMENT_ID);
      expect(result.id).toBe(PAYMENT_ID);
    });

    it('lança NotFoundException para id inexistente', async () => {
      const { service } = await buildModule({
        paymentRepo: { findById: jest.fn().mockResolvedValue(null) },
      });
      await expect(service.findById('not-found')).rejects.toThrow(NotFoundException);
    });
  });
});
