import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProviderRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.provider.findMany({
      where: { deletedAt: null },
      include: {
        user: true,
        services: { where: { deletedAt: null, isActive: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { rating: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.provider.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: true,
        services: { where: { deletedAt: null, isActive: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: { user: true, service: true },
          take: 20,
        },
      },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.provider.findFirst({
      where: { userId, deletedAt: null },
      include: { user: true, services: true, images: true },
    });
  }

  findByFirebaseUid(firebaseUid: string) {
    return this.prisma.provider.findFirst({
      where: { user: { firebaseUid }, deletedAt: null },
      include: {
        user: true,
        services: { where: { deletedAt: null, isActive: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  create(userId: string, categories: string[]) {
    return this.prisma.provider.create({
      data: { userId, categories },
    });
  }

  update(id: string, data: Partial<{ categories: string[]; isVerified: boolean }>) {
    return this.prisma.provider.update({ where: { id }, data });
  }

  updateRating(id: string, rating: number, totalReviews: number) {
    return this.prisma.provider.update({
      where: { id },
      data: { rating, totalReviews },
    });
  }

  softDelete(id: string) {
    return this.prisma.provider.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  addImage(providerId: string, url: string, sortOrder: number, mediaFileId?: string) {
    return this.prisma.providerImage.create({
      data: { providerId, url, sortOrder, ...(mediaFileId && { mediaFileId }) },
    });
  }

  removeImage(imageId: string) {
    return this.prisma.providerImage.delete({ where: { id: imageId } });
  }
}
