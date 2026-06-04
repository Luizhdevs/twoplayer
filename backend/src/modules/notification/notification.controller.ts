import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.notificationService.findAllByUser(userId);
  }

  @Get('user/:userId/unread')
  getUnreadCount(@Param('userId') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Patch('user/:userId/read-all')
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }
}
