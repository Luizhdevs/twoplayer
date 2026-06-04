import { Injectable } from '@nestjs/common';
import { MediaCategory } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.mediaFile.findFirst({
      where: { id, deletedAt: null },
    });
  }

  findByOwner(ownerId: string, category?: MediaCategory) {
    return this.prisma.mediaFile.findMany({
      where: {
        ownerId,
        deletedAt: null,
        ...(category && { category }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findActiveAvatar(ownerId: string) {
    return this.prisma.mediaFile.findFirst({
      where: { ownerId, category: 'AVATAR', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: {
    ownerId: string;
    url: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
    category: MediaCategory;
  }) {
    return this.prisma.mediaFile.create({ data });
  }

  softDelete(id: string) {
    return this.prisma.mediaFile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  countByOwnerAndCategory(ownerId: string, category: MediaCategory) {
    return this.prisma.mediaFile.count({
      where: { ownerId, category, deletedAt: null },
    });
  }
}
