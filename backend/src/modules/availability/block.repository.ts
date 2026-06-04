import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';

@Injectable()
export class BlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProvider(providerId: string) {
    return this.prisma.providerBlock.findMany({
      where: { providerId, deletedAt: null },
      orderBy: { startDatetime: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.providerBlock.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Retorna bloqueios ativos que se sobrepõem a qualquer instante dentro do dia.
   * Usado pelo gerador de slots.
   */
  findByProviderAndDate(providerId: string, date: Date) {
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    return this.prisma.providerBlock.findMany({
      where: {
        providerId,
        deletedAt: null,
        startDatetime: { lte: dayEnd },
        endDatetime:   { gte: dayStart },
      },
    });
  }

  /**
   * Verifica se um instante específico está dentro de algum bloco.
   */
  findBlockAtTime(providerId: string, datetime: Date) {
    return this.prisma.providerBlock.findFirst({
      where: {
        providerId,
        deletedAt: null,
        startDatetime: { lte: datetime },
        endDatetime:   { gt: datetime },
      },
    });
  }

  create(providerId: string, dto: CreateBlockDto) {
    return this.prisma.providerBlock.create({
      data: {
        providerId,
        startDatetime: new Date(dto.startDateTime),
        endDatetime:   new Date(dto.endDateTime),
        reason:        dto.reason,
      },
    });
  }

  softDelete(id: string) {
    return this.prisma.providerBlock.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
