import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { AppointmentRepository } from './appointment.repository';
import { AppointmentExpirationService } from './appointment-expiration.service';
import { ServiceModule } from '../service/service.module';
import { AvailabilityModule } from '../availability/availability.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ServiceModule, AvailabilityModule, NotificationModule],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentRepository, AppointmentExpirationService],
  exports: [AppointmentService, AppointmentRepository],
})
export class AppointmentModule {}
