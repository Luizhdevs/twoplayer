import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId, deletedAt: null },
      orderBy: { scheduledAt: 'desc' },
      include: {
        service: true,
        provider: { include: { user: true } },
      },
    });
  }

  findAllByProvider(providerId: string) {
    return this.prisma.appointment.findMany({
      where: { providerId, deletedAt: null },
      orderBy: { scheduledAt: 'desc' },
      include: {
        service: true,
        user: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.appointment.findFirst({
      where: { id, deletedAt: null },
      include: {
        service: true,
        provider: { include: { user: true } },
        user: true,
        review: true,
      },
    });
  }

  async create(dto: CreateAppointmentDto, amount: number) {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    return this.prisma.appointment.create({
      data: {
        userId:      dto.userId,
        serviceId:   dto.serviceId,
        providerId:  dto.providerId,
        scheduledAt: new Date(dto.scheduledAt),
        notes:       dto.notes,
        amount,
        expiresAt,
        status:      'PENDING_PAYMENT',
      },
      include: { service: true, provider: { include: { user: true } }, user: true },
    });
  }

  findExpiredPendingPayments() {
    return this.prisma.appointment.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        deletedAt: null,
        expiresAt: { lte: new Date() },
      },
      include: { user: true, service: true, provider: { include: { user: true } } },
    });
  }

  expireAppointment(id: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });
  }

  updateStatus(id: string, status: AppointmentStatus) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }

  softDelete(id: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  checkConflict(providerId: string, scheduledAt: Date) {
    const start = new Date(scheduledAt.getTime() - 30 * 60 * 1000);
    const end   = new Date(scheduledAt.getTime() + 30 * 60 * 1000);
    return this.prisma.appointment.findFirst({
      where: {
        providerId,
        deletedAt: null,
        status: { in: ['PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'PAID'] },
        scheduledAt: { gte: start, lte: end },
      },
    });
  }

  async requestEarlyAccess(id: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        earlyAccessStatus:      'PENDING',
        earlyAccessRequestedAt: new Date(),
      },
      include: { service: true, provider: { include: { user: true } }, user: true },
    });
  }

  async acceptEarlyAccess(id: string, meetingUrl: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        earlyAccessStatus:      'ACCEPTED',
        earlyAccessRespondedAt: new Date(),
        status:                 'IN_PROGRESS',
        meetingUrl,
      },
      include: { service: true, provider: { include: { user: true } }, user: true },
    });
  }

  async rejectEarlyAccess(id: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        earlyAccessStatus:      'REJECTED',
        earlyAccessRespondedAt: new Date(),
      },
      include: { service: true, provider: { include: { user: true } }, user: true },
    });
  }

  findByProviderAndDate(providerId: string, date: Date) {
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    return this.prisma.appointment.findMany({
      where: {
        providerId,
        deletedAt: null,
        status: { in: ['PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'PAID'] },
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
      select: { scheduledAt: true },
    });
  }
}
