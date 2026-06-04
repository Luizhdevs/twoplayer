import { AppointmentStatus } from '@prisma/client';

export class AppointmentEventEntity {
  id: string;
  appointmentId: string;
  actorId: string | null;
  actorRole: string;
  action: string;
  fromStatus: AppointmentStatus;
  toStatus: AppointmentStatus;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
