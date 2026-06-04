import { Injectable } from '@nestjs/common';
import { EscrowStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AUTO_RELEASE_DAYS } from './escrow.constants';

@Injectable()
export class EscrowRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAppointmentId(appointmentId: string) {
    return this.prisma.escrowTransaction.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: { user: true, provider: { include: { user: true } } },
        },
        provider: { include: { user: true } },
      },
    });
  }

  findById(id: string) {
    return this.prisma.escrowTransaction.findFirst({
      where: { id, deletedAt: null },
    });
  }

  create(data: {
    appointmentId: string;
    paymentId: string;
    providerId: string;
    amount: number;
  }) {
    return this.prisma.escrowTransaction.create({ data });
  }

  updateStatus(id: string, status: EscrowStatus, releasedAt?: Date) {
    return this.prisma.escrowTransaction.update({
      where: { id },
      data: { status, ...(releasedAt && { releasedAt }) },
    });
  }

  /**
   * Busca agendamentos em AWAITING_CLIENT_CONFIRMATION há mais de AUTO_RELEASE_DAYS.
   * Usado pelo job diário de auto-release.
   */
  findStaleForAutoRelease() {
    const cutoff = new Date(
      Date.now() - AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000,
    );
    return this.prisma.appointment.findMany({
      where: {
        status:   'AWAITING_CLIENT_CONFIRMATION',
        updatedAt: { lte: cutoff },
        deletedAt: null,
      },
      include: {
        escrowTransaction: true,
        provider:          { include: { user: true } },
      },
    });
  }
}
