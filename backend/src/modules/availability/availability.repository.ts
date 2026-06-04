import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AvailabilitySlotDto } from './dto/availability-slot.dto';

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProvider(providerId: string) {
    return this.prisma.providerAvailability.findMany({
      where: { providerId, deletedAt: null },
      orderBy: { weekday: 'asc' },
    });
  }

  findByProviderAndWeekday(providerId: string, weekday: number) {
    return this.prisma.providerAvailability.findFirst({
      where: { providerId, weekday, deletedAt: null },
    });
  }

  /**
   * Substitui a disponibilidade inteira dentro de uma transaction atômica.
   * Remove todos os registros ativos do provider e insere os novos.
   */
  async replaceAll(providerId: string, slots: AvailabilitySlotDto[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.providerAvailability.deleteMany({ where: { providerId } });

      if (slots.length === 0) return [];

      return tx.providerAvailability.createMany({
        data: slots.map((s) => ({
          providerId,
          weekday:   s.weekday,
          startTime: s.startTime,
          endTime:   s.endTime,
        })),
      });
    });
  }
}
