import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { EscrowRepository } from './escrow.repository';
import { EventRepository } from './event.repository';
import { PrismaService } from '../../database/prisma.service';
import { ACTIONS, STATE_TRANSITIONS } from './escrow.constants';

type TransitionKey = keyof typeof STATE_TRANSITIONS;

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly escrowRepo: EscrowRepository,
    private readonly eventRepo:  EventRepository,
    private readonly prisma:     PrismaService,
  ) {}

  // ── Consultas ─────────────────────────────────────────────────────────────

  getByAppointmentId(appointmentId: string) {
    return this.escrowRepo.findByAppointmentId(appointmentId);
  }

  getEvents(appointmentId: string) {
    return this.eventRepo.findByAppointmentId(appointmentId);
  }

  // ── FASE 3: Criar escrow quando pagamento é aprovado ─────────────────────
  // Chamado dentro do $transaction do webhook de pagamento.

  async createHeld(
    tx: any,
    data: {
      appointmentId: string;
      paymentId:     string;
      providerId:    string;
      amount:        number;
    },
  ) {
    const escrow = await tx.escrowTransaction.create({ data: { ...data, status: 'HELD' } });

    await tx.appointmentEvent.create({
      data: {
        appointmentId: data.appointmentId,
        actorId:       null,
        actorRole:     'SYSTEM',
        action:        ACTIONS.ESCROW_HELD,
        fromStatus:    'PAID' as AppointmentStatus,
        toStatus:      'PAID' as AppointmentStatus,
        metadata:      { escrowId: escrow.id, amount: data.amount },
      },
    });

    return escrow;
  }

  // ── FASE 4: Provider confirma agendamento PAID → CONFIRMED ───────────────

  async confirmAppointment(appointmentId: string, providerUserId: string) {
    return this.applyProviderTransition(appointmentId, providerUserId, 'confirm');
  }

  // ── FASE 5: Provider inicia serviço CONFIRMED → IN_PROGRESS ──────────────

  async startAppointment(appointmentId: string, providerUserId: string) {
    return this.applyProviderTransition(appointmentId, providerUserId, 'start');
  }

  // ── FASE 6: Provider finaliza IN_PROGRESS → AWAITING_CLIENT_CONFIRMATION ─

  async finishAppointment(appointmentId: string, providerUserId: string) {
    return this.applyProviderTransition(appointmentId, providerUserId, 'finish');
  }

  // ── FASE 7: Cliente aprova → COMPLETED + libera escrow na wallet ──────────

  async approveAppointment(appointmentId: string, clientUserId: string) {
    const appointment = await this.loadAppointment(appointmentId);
    const transition  = STATE_TRANSITIONS.approve;

    this.assertStatus(appointment.status as AppointmentStatus, transition.from);

    if (appointment.userId !== clientUserId) {
      throw new ForbiddenException('Apenas o cliente pode aprovar a execução');
    }

    const escrow = await this.escrowRepo.findByAppointmentId(appointmentId);
    if (!escrow) throw new NotFoundException('Escrow não encontrado para este agendamento');

    if (escrow.status !== 'HELD') {
      throw new ConflictException('Escrow já foi processado — aprovação duplicada');
    }

    await this.releaseEscrow(appointmentId, clientUserId, 'USER', ACTIONS.APPROVE);

    return this.loadAppointment(appointmentId);
  }

  // ── FASE 8: Auto-release por expiração (chamado pelo Job) ────────────────

  async processAutoReleases(): Promise<number> {
    const stale = await this.escrowRepo.findStaleForAutoRelease();
    let released = 0;

    for (const appt of stale) {
      if (!appt.escrowTransaction || appt.escrowTransaction.status !== 'HELD') continue;
      try {
        await this.releaseEscrow(appt.id, null, 'SYSTEM', ACTIONS.AUTO_RELEASE);
        released++;
        this.logger.log(`Auto-release: appointment=${appt.id}`);
      } catch (err) {
        this.logger.error(`Auto-release falhou: appointment=${appt.id}`, err);
      }
    }

    return released;
  }

  // ── Núcleo: transição de status com registro de evento (provider) ─────────

  private async applyProviderTransition(
    appointmentId: string,
    providerUserId: string,
    transitionKey: TransitionKey,
  ) {
    const appointment = await this.loadAppointment(appointmentId);
    const transition  = STATE_TRANSITIONS[transitionKey];

    this.assertStatus(appointment.status as AppointmentStatus, transition.from);

    // Verifica que o caller é o provider do agendamento
    const provider = (appointment.provider as any);
    if (provider?.user?.id !== providerUserId && provider?.userId !== providerUserId) {
      throw new ForbiddenException('Apenas o provider pode executar esta ação');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data:  { status: transition.to },
      });
      await tx.appointmentEvent.create({
        data: {
          appointmentId,
          actorId:    providerUserId,
          actorRole:  'PROVIDER',
          action:     ACTIONS[transitionKey.toUpperCase() as keyof typeof ACTIONS],
          fromStatus: transition.from,
          toStatus:   transition.to,
        },
      });
    });

    return this.loadAppointment(appointmentId);
  }

  // ── Núcleo: liberar escrow + creditar wallet (dentro de $transaction) ─────

  private async releaseEscrow(
    appointmentId: string,
    actorId:       string | null,
    actorRole:     'USER' | 'SYSTEM',
    action:        string,
  ) {
    const escrow = await this.escrowRepo.findByAppointmentId(appointmentId);
    if (!escrow) throw new NotFoundException('Escrow não encontrado');

    await this.prisma.$transaction(async (tx) => {
      // 1. HELD → RELEASED
      await tx.escrowTransaction.update({
        where: { id: escrow.id },
        data:  { status: 'RELEASED', releasedAt: new Date() },
      });

      // 2. Appointment → COMPLETED
      await tx.appointment.update({
        where: { id: appointmentId },
        data:  { status: 'COMPLETED' },
      });

      // 3. Crédito na wallet do provider
      const wallet = await tx.wallet.findFirst({
        where: { ownerId: escrow.provider.userId, deletedAt: null },
      });

      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data:  { balance: { increment: escrow.amount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId:    wallet.id,
            type:        'CREDIT',
            amount:      escrow.amount,
            description: `Liberação de escrow — agendamento ${appointmentId}`,
            referenceId: escrow.id,
            status:      'COMPLETED',
          },
        });
      } else {
        this.logger.warn(`Wallet não encontrada para provider=${escrow.providerId}`);
      }

      // 4. Auditoria
      await tx.appointmentEvent.create({
        data: {
          appointmentId,
          actorId,
          actorRole,
          action,
          fromStatus: 'AWAITING_CLIENT_CONFIRMATION',
          toStatus:   'COMPLETED',
          metadata:   { escrowId: escrow.id, amount: escrow.amount, releasedAt: new Date().toISOString() },
        },
      });
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async loadAppointment(id: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id, deletedAt: null },
      include: { provider: { include: { user: true } }, user: true, service: true },
    });
    if (!appt) throw new NotFoundException('Agendamento não encontrado');
    return appt;
  }

  private assertStatus(current: AppointmentStatus, expected: AppointmentStatus) {
    if (current !== expected) {
      throw new ConflictException(
        `Status inválido para esta ação. Atual: ${current}, esperado: ${expected}`,
      );
    }
  }
}
