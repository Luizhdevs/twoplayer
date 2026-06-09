import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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

  async requestEarlyAccess(id: string, userId: string) {
    const appt = await this.findById(id);

    if (appt.userId !== userId) throw new ForbiddenException('Sem permissão');

    const TERMINAL = ['CANCELLED', 'EXPIRED', 'REFUNDED', 'DISPUTED', 'COMPLETED', 'IN_PROGRESS'];
    if (TERMINAL.includes(appt.status)) {
      throw new BadRequestException('Este agendamento não permite entrada antecipada');
    }
    if (!['PAID', 'CONFIRMED'].includes(appt.status)) {
      throw new BadRequestException('Entrada antecipada só pode ser solicitada em agendamentos pagos ou confirmados');
    }
    if (appt.earlyAccessStatus === 'PENDING') {
      throw new ConflictException('Já existe uma solicitação pendente');
    }
    if (appt.earlyAccessStatus === 'ACCEPTED') {
      throw new BadRequestException('Entrada antecipada já foi aceita');
    }

    const updated = await this.repo.requestEarlyAccess(id);

    const providerUserId = (updated.provider as any)?.user?.id;
    if (providerUserId) {
      await this.notificationService.notify(
        providerUserId,
        'Solicitação de entrada antecipada',
        'O cliente solicitou entrada antecipada na reunião.',
        'APPOINTMENT',
        { appointmentId: id },
      );
    }

    return updated;
  }

  async acceptEarlyAccess(id: string, userId: string) {
    const appt = await this.findById(id);

    const providerUserId = (appt.provider as any)?.user?.id;
    if (providerUserId !== userId) throw new ForbiddenException('Sem permissão');

    if (appt.earlyAccessStatus !== 'PENDING') {
      throw new BadRequestException('Não há solicitação pendente para este agendamento');
    }
    if (!['PAID', 'CONFIRMED'].includes(appt.status)) {
      throw new BadRequestException('Agendamento não está em estado válido para aceitar entrada antecipada');
    }

    const meetingUrl = appt.meetingUrl ?? `https://meet.jit.si/twoplayers-${id}`;
    const updated = await this.repo.acceptEarlyAccess(id, meetingUrl);

    await this.notificationService.notify(
      appt.userId,
      'Entrada antecipada aceita',
      'O colaborador aceitou sua solicitação. A reunião já está disponível.',
      'APPOINTMENT',
      { appointmentId: id },
    );

    return updated;
  }

  async rejectEarlyAccess(id: string, userId: string) {
    const appt = await this.findById(id);

    const providerUserId = (appt.provider as any)?.user?.id;
    if (providerUserId !== userId) throw new ForbiddenException('Sem permissão');

    if (appt.earlyAccessStatus !== 'PENDING') {
      throw new BadRequestException('Não há solicitação pendente para este agendamento');
    }

    const updated = await this.repo.rejectEarlyAccess(id);

    await this.notificationService.notify(
      appt.userId,
      'Entrada antecipada recusada',
      'O colaborador recusou a entrada antecipada. Aguarde o horário agendado.',
      'APPOINTMENT',
      { appointmentId: id },
    );

    return updated;
  }
}
