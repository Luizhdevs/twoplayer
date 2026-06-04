import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
      include: { appointment: { include: { service: true, provider: { include: { user: true } } } } },
    });
  }

  findByAppointmentId(appointmentId: string) {
    return this.prisma.payment.findFirst({
      where: { appointmentId, deletedAt: null },
    });
  }

  findByExternalId(externalId: string) {
    return this.prisma.payment.findFirst({
      where: { externalId, deletedAt: null },
    });
  }

  create(data: {
    appointmentId: string;
    externalId: string;
    amount: number;
    currency?: string;
  }) {
    return this.prisma.payment.create({
      data: {
        appointmentId: data.appointmentId,
        externalId:    data.externalId,
        amount:        data.amount,
        currency:      data.currency ?? 'BRL',
        status:        'PENDING',
      },
    });
  }

  updateStatus(
    id: string,
    status: PaymentStatus,
    extra?: { paymentMethod?: string; paidAt?: Date },
  ) {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status,
        ...(extra?.paymentMethod !== undefined && { paymentMethod: extra.paymentMethod }),
        ...(extra?.paidAt !== undefined && { paidAt: extra.paidAt }),
      },
    });
  }

  softDelete(id: string) {
    return this.prisma.payment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
