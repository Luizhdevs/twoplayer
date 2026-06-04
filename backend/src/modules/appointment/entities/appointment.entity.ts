import { AppointmentStatus } from '@prisma/client';

export class AppointmentEntity {
  id: string;
  userId: string;
  serviceId: string;
  providerId: string;
  scheduledAt: Date;
  status: AppointmentStatus;
  notes: string | null;
  amount: number;
  meetingUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
