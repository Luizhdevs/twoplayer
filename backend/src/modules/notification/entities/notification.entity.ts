import { NotificationType } from '@prisma/client';

export class NotificationEntity {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  type: NotificationType;
  readAt: Date | null;
  data: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
