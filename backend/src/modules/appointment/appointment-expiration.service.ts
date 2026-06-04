import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentRepository } from './appointment.repository';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AppointmentExpirationService {
  private readonly logger = new Logger(AppointmentExpirationService.name);

  constructor(
    private readonly repo: AppointmentRepository,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireStaleAppointments() {
    const expired = await this.repo.findExpiredPendingPayments();
    if (!expired.length) return;

    this.logger.log(`Expirando ${expired.length} agendamento(s) sem pagamento`);

    await Promise.all(
      expired.map(async (appt) => {
        await this.repo.expireAppointment(appt.id);
        await this.notificationService.notify(
          appt.userId,
          'Agendamento expirado',
          `Seu agendamento com ${appt.provider?.user?.name ?? 'o prestador'} expirou por falta de pagamento.`,
          'APPOINTMENT',
          { appointmentId: appt.id },
        );
      }),
    );
  }
}
