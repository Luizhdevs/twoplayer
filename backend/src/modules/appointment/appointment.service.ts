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

@Injectable()
export class AppointmentService {
  constructor(
    private readonly repo: AppointmentRepository,
    private readonly serviceRepo: ServiceRepository,
    private readonly availabilityService: AvailabilityService,
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

    // Fase 5 + 6: Validação de disponibilidade real (notice, max-ahead, weekday, blocks)
    await this.availabilityService.validateBooking(dto.providerId, scheduledAt);

    // Verificação de conflito direto com appointments existentes
    const conflict = await this.repo.checkConflict(dto.providerId, scheduledAt);
    if (conflict) {
      throw new ConflictException('Horário indisponível — já existe agendamento neste horário');
    }

    return this.repo.create(dto, svc.price);
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
    return this.repo.updateStatus(id, 'CANCELLED');
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }
}
