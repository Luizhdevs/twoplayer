import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface RecordEventInput {
  appointmentId: string;
  actorId:       string | null;
  actorRole:     'USER' | 'PROVIDER' | 'SYSTEM';
  action:        string;
  fromStatus:    AppointmentStatus;
  toStatus:      AppointmentStatus;
  metadata?:     Record<string, unknown>;
}

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAppointmentId(appointmentId: string) {
    return this.prisma.appointmentEvent.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  record(input: RecordEventInput) {
    return this.prisma.appointmentEvent.create({
      data: {
        appointmentId: input.appointmentId,
        actorId:       input.actorId,
        actorRole:     input.actorRole,
        action:        input.action,
        fromStatus:    input.fromStatus,
        toStatus:      input.toStatus,
        metadata:      (input.metadata ?? null) as any,
      },
    });
  }

  /** Versão usada dentro de $transaction do Prisma */
  recordWithTx(
    tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    input: RecordEventInput,
  ) {
    return tx.appointmentEvent.create({
      data: {
        appointmentId: input.appointmentId,
        actorId:       input.actorId,
        actorRole:     input.actorRole,
        action:        input.action,
        fromStatus:    input.fromStatus,
        toStatus:      input.toStatus,
        metadata:      (input.metadata ?? null) as any,
      },
    });
  }
}
