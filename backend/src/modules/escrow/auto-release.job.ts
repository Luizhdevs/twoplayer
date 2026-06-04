import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EscrowService } from './escrow.service';

@Injectable()
export class AutoReleaseJob {
  private readonly logger = new Logger(AutoReleaseJob.name);

  constructor(private readonly escrowService: EscrowService) {}

  /**
   * Executa diariamente à meia-noite UTC.
   * Libera escrows de agendamentos em AWAITING_CLIENT_CONFIRMATION
   * há mais de AUTO_RELEASE_DAYS dias sem resposta do cliente.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async run() {
    this.logger.log('Auto-release job iniciado');
    try {
      const count = await this.escrowService.processAutoReleases();
      this.logger.log(`Auto-release finalizado: ${count} agendamento(s) liberado(s)`);
    } catch (err) {
      this.logger.error('Auto-release job falhou', err);
    }
  }
}
