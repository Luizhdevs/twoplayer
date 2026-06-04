import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentRepository } from './appointment.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ServiceRepository } from '../service/service.repository';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly repo: AppointmentRepository,
    private readonly serviceRepo: ServiceRepository,
    private readonly availabilityService: AvailabilityService,
    private readonly notificationService: NotificationService,
  ) {}

  findAllByUser(userId: string) {
    return this.repo.findAllByUser(userId);
  }

  findAllByProvider(providerId: string) {
    return this.repo.findAllByProvider(providerId);
  }

  async findById(id: string) {
    const appt = await this.repo.findById(id);
    if (!appt) throw new NotFoundException('Agendamento não encontrado');
    return appt;
  }

  async create(dto: CreateAppointmentDto) {
    const svc = await this.serviceRepo.findById(dto.serviceId);
    if (!svc) throw new NotFoundException('Serviço não encontrado');
    if (!svc.isActive) throw new BadRequestException('Serviço inativo');

    const scheduledAt = new Date(dto.scheduledAt);

    await this.availabilityService.validateBooking(dto.providerId, scheduledAt);

    const conflict = await this.repo.checkConflict(dto.providerId, scheduledAt);
    if (conflict) {
      throw new ConflictException('Horário indisponível — já existe agendamento neste horário');
    }

    const appt = await this.repo.create(dto, svc.price);

    // Notificar criação
    await this.notificationService.notify(
      dto.userId,
      'Agendamento criado',
      `Seu agendamento para ${svc.title} foi criado. Complete o pagamento em até 30 minutos.`,
      'APPOINTMENT',
      { appointmentId: appt.id },
    );

    // Notificar prestador
    const providerUserId = (appt.provider as any)?.user?.id;
    if (providerUserId) {
      await this.notificationService.notify(
        providerUserId,
        'Novo agendamento',
        `Um cliente agendou ${svc.title}. Aguardando pagamento.`,
        'APPOINTMENT',
        { appointmentId: appt.id },
      );
    }

    return appt;
  }

  async updateStatus(id: string, dto: UpdateAppointmentDto) {
    await this.findById(id);
    return this.repo.updateStatus(id, dto.status as AppointmentStatus);
  }

  async cancel(id: string) {
    const appt = await this.findById(id);
    if (appt.status === 'COMPLETED') {
      throw new BadRequestException('Agendamento já concluído não pode ser cancelado');
    }
    if (['CANCELLED', 'EXPIRED', 'REFUNDED'].includes(appt.status)) {
      throw new BadRequestException('Agendamento já está cancelado ou expirado');
    }
    const updated = await this.repo.updateStatus(id, 'CANCELLED');

    // Notificar cancelamento
    await this.notificationService.notify(
      appt.userId,
      'Agendamento cancelado',
      `Seu agendamento foi cancelado.`,
      'APPOINTMENT',
      { appointmentId: id },
    );

    return updated;
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }
}
