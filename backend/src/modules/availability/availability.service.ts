import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilityRepository } from './availability.repository';
import { BlockRepository } from './block.repository';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import {
  MIN_BOOKING_NOTICE_HOURS,
  MAX_BOOKING_DAYS_AHEAD,
  WEEKDAY_NAMES,
} from './availability.constants';
import {
  generateSlots,
  buildSlotDatetime,
  extractTimeUTC,
  timeToMinutes,
} from './slot-generator';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly availabilityRepo: AvailabilityRepository,
    private readonly blockRepo: BlockRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Disponibilidade semanal ──────────────────────────────────────────────

  getAvailability(providerId: string) {
    return this.availabilityRepo.findByProvider(providerId);
  }

  async setAvailability(providerId: string, dto: SetAvailabilityDto) {
    this.validateSchedule(dto);
    await this.availabilityRepo.replaceAll(providerId, dto.schedule);
    return this.availabilityRepo.findByProvider(providerId);
  }

  // ── Bloqueios ────────────────────────────────────────────────────────────

  getBlocks(providerId: string) {
    return this.blockRepo.findByProvider(providerId);
  }

  async createBlock(providerId: string, dto: CreateBlockDto) {
    const start = new Date(dto.startDateTime);
    const end   = new Date(dto.endDateTime);

    if (end <= start) {
      throw new BadRequestException('endDateTime deve ser posterior a startDateTime');
    }
    if (start < new Date()) {
      throw new BadRequestException('startDateTime deve ser no futuro');
    }

    return this.blockRepo.create(providerId, dto);
  }

  async removeBlock(blockId: string, providerId: string) {
    const block = await this.blockRepo.findById(blockId);
    if (!block) throw new NotFoundException('Bloqueio não encontrado');
    if (block.providerId !== providerId) throw new ForbiddenException('Sem permissão');
    return this.blockRepo.softDelete(blockId);
  }

  // ── Slots disponíveis ────────────────────────────────────────────────────

  async getAvailableSlots(
    providerId: string,
    dateStr: string,
    serviceDuration?: number,
  ): Promise<string[]> {
    const date = new Date(`${dateStr}T00:00:00.000Z`);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
    }

    const weekday = date.getUTCDay();
    const duration = serviceDuration && serviceDuration > 0 ? serviceDuration : undefined;

    const [availability, appointments, blocks] = await Promise.all([
      this.availabilityRepo.findByProviderAndWeekday(providerId, weekday),
      this.prisma.appointment.findMany({
        where: {
          providerId,
          deletedAt: null,
          status: { in: ['PENDING_PAYMENT', 'PENDING', 'PAID', 'CONFIRMED', 'IN_PROGRESS'] },
          scheduledAt: {
            gte: new Date(`${dateStr}T00:00:00.000Z`),
            lte: new Date(`${dateStr}T23:59:59.999Z`),
          },
        },
        select: { scheduledAt: true, service: { select: { duration: true } } },
      }),
      this.blockRepo.findByProviderAndDate(providerId, date),
    ]);

    if (!availability) return [];

    const slots   = generateSlots(availability.startTime, availability.endTime, duration);
    const now     = new Date();
    const minTime = new Date(now.getTime() + MIN_BOOKING_NOTICE_HOURS * 60 * 60 * 1000);
    const maxTime = new Date(now.getTime() + MAX_BOOKING_DAYS_AHEAD * 24 * 60 * 60 * 1000);

    // Cada agendamento existente bloqueia [scheduledAt, scheduledAt + duration)
    const bookedRanges = appointments.map((a) => ({
      start: a.scheduledAt,
      end:   new Date(a.scheduledAt.getTime() + (a.service?.duration ?? 60) * 60 * 1000),
    }));

    return slots.filter((slot) => {
      const slotStart = buildSlotDatetime(dateStr, slot);
      const slotEnd   = new Date(slotStart.getTime() + (duration ?? 60) * 60 * 1000);

      if (slotStart <= minTime) return false;
      if (slotStart >  maxTime) return false;

      // Verifica se o slot se sobrepõe com algum agendamento existente
      const hasConflict = bookedRanges.some(
        (r) => slotStart < r.end && slotEnd > r.start,
      );
      if (hasConflict) return false;

      const isBlocked = blocks.some(
        (b) => slotStart < b.endDatetime && slotEnd > b.startDatetime,
      );
      return !isBlocked;
    });
  }

  // ── Validação para criação de Appointment ────────────────────────────────

  async validateBooking(providerId: string, scheduledAt: Date): Promise<void> {
    const now      = new Date();
    const minTime  = new Date(now.getTime() + MIN_BOOKING_NOTICE_HOURS * 60 * 60 * 1000);
    const maxTime  = new Date(now.getTime() + MAX_BOOKING_DAYS_AHEAD * 24 * 60 * 60 * 1000);

    if (scheduledAt <= minTime) {
      throw new BadRequestException(
        `Agendamento requer antecedência mínima de ${MIN_BOOKING_NOTICE_HOURS}h`,
      );
    }

    if (scheduledAt > maxTime) {
      throw new BadRequestException(
        `Agendamento não pode exceder ${MAX_BOOKING_DAYS_AHEAD} dias à frente`,
      );
    }

    const weekday  = scheduledAt.getUTCDay();
    const timeStr  = extractTimeUTC(scheduledAt);

    const availability = await this.availabilityRepo.findByProviderAndWeekday(providerId, weekday);
    if (!availability) {
      const dayName = WEEKDAY_NAMES[weekday];
      throw new ConflictException(`Provider não atende às ${dayName}s`);
    }

    const slotMin  = timeToMinutes(timeStr);
    const startMin = timeToMinutes(availability.startTime);
    const endMin   = timeToMinutes(availability.endTime);

    if (slotMin < startMin || slotMin >= endMin) {
      throw new ConflictException(
        `Horário ${timeStr} fora da disponibilidade (${availability.startTime}–${availability.endTime})`,
      );
    }

    const block = await this.blockRepo.findBlockAtTime(providerId, scheduledAt);
    if (block) {
      const reason = block.reason ? ` (${block.reason})` : '';
      throw new ConflictException(`Horário bloqueado pelo prestador${reason}`);
    }
  }

  // ── Validação interna do DTO de disponibilidade ──────────────────────────

  private validateSchedule(dto: SetAvailabilityDto) {
    const weekdays = dto.schedule.map((s) => s.weekday);
    const duplicates = weekdays.filter((d, i) => weekdays.indexOf(d) !== i);
    if (duplicates.length > 0) {
      throw new BadRequestException(
        `Dias duplicados no schedule: ${[...new Set(duplicates)].join(', ')}`,
      );
    }

    for (const slot of dto.schedule) {
      if (timeToMinutes(slot.startTime) >= timeToMinutes(slot.endTime)) {
        throw new BadRequestException(
          `[weekday ${slot.weekday}] startTime (${slot.startTime}) deve ser anterior a endTime (${slot.endTime})`,
        );
      }
    }
  }
}
