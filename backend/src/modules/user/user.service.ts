import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MediaService } from '../media/media.service';
import { MediaRepository } from '../media/media.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly repo: UserRepository,
    private readonly mediaService: MediaService,
    private readonly mediaRepo: MediaRepository,
  ) {}

  findAll() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findByFirebaseUid(uid: string) {
    const user = await this.repo.findByFirebaseUid(uid);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.repo.findByEmail(dto.email);
    if (exists) throw new ConflictException('E-mail já cadastrado');
    return this.repo.create(dto);
  }

  async upsertFromFirebase(firebaseUid: string, email: string, name: string) {
    const existing = await this.repo.findByFirebaseUid(firebaseUid);
    if (existing) return existing;
    return this.repo.create({ firebaseUid, email, name });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }

  async getProfile(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      wallet: user.wallet
        ? { balance: user.wallet.balance / 100 }
        : null,
      appointments: user.appointments.map((a) => ({
        id: a.id,
        service: a.service.title,
        provider: (a.provider as any).user?.name ?? '',
        date: a.scheduledAt.toISOString().split('T')[0],
        status: this.translateStatus(a.status),
      })),
    };
  }

  async updateAvatar(file: Express.Multer.File, firebaseUid: string) {
    const user = await this.repo.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    // 1. Upload do novo avatar
    const { id: mediaId, url } = await this.mediaService.upload(file, 'AVATAR', user.id);

    // 2. Busca e remove o avatar anterior
    const oldAvatar = await this.mediaRepo.findActiveAvatar(user.id);
    if (oldAvatar && oldAvatar.id !== mediaId) {
      await this.mediaService.deleteFromStorage(oldAvatar.storageKey);
      await this.mediaRepo.softDelete(oldAvatar.id);
    }

    // 3. Atualiza avatarUrl do usuário
    return this.repo.update(user.id, { avatarUrl: url } as any);
  }

  private translateStatus(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pendente',
      CONFIRMED: 'Agendado',
      COMPLETED: 'Concluído',
      CANCELLED: 'Cancelado',
    };
    return map[status] ?? status;
  }
}
