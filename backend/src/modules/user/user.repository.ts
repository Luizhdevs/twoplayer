import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        wallet: true,
        appointments: {
          where: { deletedAt: null },
          orderBy: { scheduledAt: 'desc' },
          include: {
            service: true,
            provider: { include: { user: true } },
          },
        },
      },
    });
  }

  findByFirebaseUid(uid: string) {
    return this.prisma.user.findUnique({
      where: { firebaseUid: uid },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        firebaseUid: dto.firebaseUid,
        cpf: dto.cpf,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
        ...(dto.role && { role: dto.role as Role }),
        wallet: { create: { balance: 0 } },
      },
    });
  }

  update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.birthDate && { birthDate: new Date(dto.birthDate) }),
        ...(dto.role && { role: dto.role as Role }),
      },
    });
  }

  softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
