import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByProvider(providerId: string) {
    return this.prisma.service.findMany({
      where: { providerId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: { provider: { include: { user: true } } },
    });
  }

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        providerId: dto.providerId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        duration: dto.duration,
      },
    });
  }

  update(id: string, dto: UpdateServiceDto) {
    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  softDelete(id: string) {
    return this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
