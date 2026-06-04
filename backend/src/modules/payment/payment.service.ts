import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { AppointmentRepository } from '../appointment/appointment.repository';
import { MercadoPagoService } from '../../mercadopago/mercadopago.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { MpWebhookBody } from './dto/mp-webhook.dto';
import { EscrowService } from '../escrow/escrow.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly paymentRepo:     PaymentRepository,
    private readonly appointmentRepo: AppointmentRepository,
    private readonly mpService:       MercadoPagoService,
    private readonly prisma:          PrismaService,
    private readonly escrowService:   EscrowService,
  ) {}

  // ── Consultas ────────────────────────────────────────────────────────────

  async findById(id: string) {
    const payment = await this.paymentRepo.findById(id);
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    return payment;
  }

  async findByAppointmentId(appointmentId: string) {
    const payment = await this.paymentRepo.findByAppointmentId(appointmentId);
    if (!payment) throw new NotFoundException('Pagamento não encontrado para este agendamento');
    return payment;
  }

  // ── Checkout ─────────────────────────────────────────────────────────────

  async createCheckout(userDbId: string, dto: CreateCheckoutDto) {
    const appointment = await this.appointmentRepo.findById(dto.appointmentId);
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');

    // Apenas o dono pode iniciar o checkout
    if (appointment.userId !== userDbId) {
      throw new ForbiddenException('Sem permissão para este agendamento');
    }

    // Status deve ser PENDING_PAYMENT
    if (appointment.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(
        `Status inválido para checkout: ${appointment.status}. Esperado: PENDING_PAYMENT`,
      );
    }

    // Idempotência: retorna checkout existente se já criado e ainda pendente
    const existing = await this.paymentRepo.findByAppointmentId(dto.appointmentId);
    if (existing && existing.status === 'PENDING' && existing.externalId) {
      const pref = await this.mpService.createPreference({
        title:         `Sessão com ${(appointment.provider as any).user?.name ?? 'Provider'}`,
        quantity:      1,
        unitPrice:     appointment.amount / 100,
        appointmentId: appointment.id,
        payerEmail:    (appointment.user as any)?.email,
      });
      return { checkoutUrl: pref.initPoint, paymentId: existing.id };
    }

    // Cria preferência no MP
    const pref = await this.mpService.createPreference({
      title:         `Sessão com ${(appointment.provider as any).user?.name ?? 'Provider'}`,
      quantity:      1,
      unitPrice:     appointment.amount / 100,
      appointmentId: appointment.id,
      payerEmail:    (appointment.user as any)?.email,
    });

    // Persiste payment com o preferenceId como externalId
    const payment = await this.paymentRepo.create({
      appointmentId: appointment.id,
      externalId:    pref.preferenceId,
      amount:        appointment.amount,
      currency:      'BRL',
    });

    this.logger.log(`Checkout criado: payment=${payment.id} appointment=${appointment.id}`);

    return {
      checkoutUrl: pref.initPoint,
      paymentId:   payment.id,
    };
  }

  // ── Pagamento Simulado (modo acadêmico) ──────────────────────────────────

  async simulateSuccess(userDbId: string, appointmentId: string) {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');

    if (appointment.userId !== userDbId) {
      throw new ForbiddenException('Sem permissão para este agendamento');
    }

    if (appointment.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(
        `Status inválido para pagamento: ${appointment.status}. Esperado: PENDING_PAYMENT`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cria ou atualiza payment para APPROVED
      const existing = await this.paymentRepo.findByAppointmentId(appointmentId);
      let payment;

      if (existing) {
        payment = await tx.payment.update({
          where: { id: existing.id },
          data: {
            status:        'APPROVED',
            paymentMethod: 'simulated',
            externalId:    `sim_${Date.now()}`,
            paidAt:        new Date(),
          },
        });
      } else {
        payment = await tx.payment.create({
          data: {
            appointmentId,
            externalId:    `sim_${Date.now()}`,
            amount:        appointment.amount,
            currency:      'BRL',
            status:        'APPROVED',
            paymentMethod: 'simulated',
            paidAt:        new Date(),
          },
        });
      }

      // 2. Appointment → PAID + meetingUrl gerada
      const meetingUrl = `https://meet.jit.si/twoplayers-${appointmentId}`;
      await tx.appointment.update({
        where: { id: appointmentId },
        data:  { status: 'PAID', meetingUrl },
      });

      // 3. Cria escrow HELD (também registra evento ESCROW_HELD)
      await this.escrowService.createHeld(tx, {
        appointmentId,
        paymentId:  payment.id,
        providerId: appointment.providerId,
        amount:     appointment.amount,
      });

      // 4. Evento de auditoria do pagamento simulado
      await tx.appointmentEvent.create({
        data: {
          appointmentId,
          actorId:    userDbId,
          actorRole:  'USER',
          action:     'PAYMENT_SIMULATED',
          fromStatus: 'PENDING_PAYMENT',
          toStatus:   'PAID',
          metadata:   { paymentId: payment.id, simulated: true },
        },
      });

      this.logger.log(
        `Pagamento simulado: appointment=${appointmentId} payment=${payment.id}`,
      );

      return { ok: true, paymentId: payment.id, appointmentId };
    });
  }

  // ── Webhook ──────────────────────────────────────────────────────────────

  async handleWebhook(
    xSignature: string = '',
    xRequestId: string = '',
    body: MpWebhookBody,
  ): Promise<{ ok: boolean }> {

    // 1. Validar assinatura (Fase 6)
    const dataId = body?.data?.id ?? '';
    if (!this.mpService.validateWebhookSignature(xSignature, xRequestId, dataId)) {
      this.logger.warn(`Webhook com assinatura inválida — requestId=${xRequestId}`);
      throw new UnauthorizedException('Assinatura webhook inválida');
    }

    // 2. Processar apenas eventos de pagamento
    if (body?.type !== 'payment') {
      return { ok: true };
    }

    const mpPaymentId = body.data?.id;
    if (!mpPaymentId) return { ok: true };

    // 3. Buscar dados reais na API MP (nunca confiar no payload)
    let mpPayment;
    try {
      mpPayment = await this.mpService.getPayment(mpPaymentId);
    } catch (err) {
      this.logger.error(`Falha ao buscar pagamento MP ${mpPaymentId}`, err);
      return { ok: true }; // Retorna ok para MP não retransmitir
    }

    const appointmentId = mpPayment.externalReference;
    if (!appointmentId) return { ok: true };

    // 4. Localizar payment interno pela appointment
    const payment = await this.paymentRepo.findByAppointmentId(appointmentId);
    if (!payment) {
      this.logger.warn(`Payment não encontrado para appointment=${appointmentId}`);
      return { ok: true };
    }

    const newStatus = MercadoPagoService.mapStatus(mpPayment.status);

    // 5. Idempotência: ignora se já está no status final
    const finalStatuses = ['APPROVED', 'REFUNDED', 'CANCELLED'];
    if (finalStatuses.includes(payment.status) && payment.status === newStatus) {
      this.logger.log(`Webhook duplicado ignorado: payment=${payment.id} status=${newStatus}`);
      return { ok: true };
    }

    // 6. Atualização atômica — payment + appointment + escrow dentro de $transaction
    await this.prisma.$transaction(async (tx) => {
      const isApproved = newStatus === 'APPROVED';
      const isRefunded = newStatus === 'REFUNDED';

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status:        newStatus,
          paymentMethod: mpPayment.paymentMethodId,
          externalId:    String(mpPayment.id),
          ...(isApproved && { paidAt: new Date() }),
        },
      });

      if (isApproved) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data:  { status: 'PAID' },
        });

        // FASE 3: Criar escrow com valor retido (HELD) dentro da mesma transaction
        const appointment = await tx.appointment.findUnique({
          where: { id: appointmentId },
          select: { providerId: true },
        });
        if (appointment) {
          await this.escrowService.createHeld(tx, {
            appointmentId,
            paymentId:  payment.id,
            providerId: appointment.providerId,
            amount:     payment.amount,
          });
        }
      }

      if (isRefunded) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data:  { status: 'REFUNDED' },
        });
        await tx.escrowTransaction.updateMany({
          where: { appointmentId, status: 'HELD' },
          data:  { status: 'REFUNDED', releasedAt: new Date() },
        });
      }

      if (newStatus === 'CANCELLED') {
        await tx.appointment.update({
          where: { id: appointmentId },
          data:  { status: 'CANCELLED' },
        });
      }
    });

    this.logger.log(
      `Webhook processado: payment=${payment.id} mpStatus=${mpPayment.status} → ${newStatus}`,
    );

    return { ok: true };
  }
}
