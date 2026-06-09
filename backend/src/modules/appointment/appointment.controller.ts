import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.appointmentService.findAllByUser(userId);
  }

  @Get('provider/:providerId')
  findAllByProvider(@Param('providerId') providerId: string) {
    return this.appointmentService.findAllByProvider(providerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentService.create(dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentService.updateStatus(id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.appointmentService.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentService.remove(id);
  }

  @Post(':id/request-early-access')
  requestEarlyAccess(@Param('id') id: string, @Body('userId') userId: string) {
    return this.appointmentService.requestEarlyAccess(id, userId);
  }

  @Post(':id/accept-early-access')
  acceptEarlyAccess(@Param('id') id: string, @Body('userId') userId: string) {
    return this.appointmentService.acceptEarlyAccess(id, userId);
  }

  @Post(':id/reject-early-access')
  rejectEarlyAccess(@Param('id') id: string, @Body('userId') userId: string) {
    return this.appointmentService.rejectEarlyAccess(id, userId);
  }
}
