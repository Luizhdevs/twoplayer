import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByProvider(providerId: string) {
    return this.prisma.review.findMany({
      where: { providerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { user: true, service: true },
    });
  }

  findById(id: string) {
    return this.prisma.review.findFirst({
      where: { id, deletedAt: null },
      include: { user: true, service: true, provider: true },
    });
  }

  findByAppointment(appointmentId: string) {
    return this.prisma.review.findUnique({
      where: { appointmentId },
    });
  }

  async create(
    dto: CreateReviewDto,
    userId: string,
    providerId: string,
    serviceId: string,
  ) {
    return this.prisma.review.create({
      data: {
        appointmentId: dto.appointmentId,
        userId,
        providerId,
        serviceId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: { user: true, service: true },
    });
  }

  softDelete(id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getAverageRating(providerId: string) {
    const result = await this.prisma.review.aggregate({
      where: { providerId, deletedAt: null },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      avg: result._avg.rating ?? 0,
      count: result._count.rating,
    };
  }
}
