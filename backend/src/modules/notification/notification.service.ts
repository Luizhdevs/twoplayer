import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly repo: NotificationRepository) {}

  findAllByUser(userId: string) {
    return this.repo.findAllByUser(userId);
  }

  async getUnreadCount(userId: string) {
    const count = await this.repo.countUnread(userId);
    return { unread: count };
  }

  create(dto: CreateNotificationDto) {
    return this.repo.create(dto);
  }

  markAsRead(id: string) {
    return this.repo.markAsRead(id);
  }

  markAllAsRead(userId: string) {
    return this.repo.markAllAsRead(userId);
  }

  async notify(
    userId: string,
    title: string,
    body?: string,
    type: CreateNotificationDto['type'] = 'SYSTEM',
    data?: Record<string, unknown>,
  ) {
    return this.repo.create({ userId, title, body, type, data });
  }
}
