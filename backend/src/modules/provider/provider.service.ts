import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProviderRepository } from './provider.repository';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { MediaService } from '../media/media.service';
import { MediaRepository } from '../media/media.repository';
import { MAX_GALLERY_IMAGES } from '../media/media.constants';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class ProviderService {
  constructor(
    private readonly repo: ProviderRepository,
    private readonly mediaService: MediaService,
    private readonly mediaRepo: MediaRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async getHome() {
    const providers = await this.repo.findAll();

    const formatted = providers.map((p) => {
      // displayCategories: categorias dos serviços (exibidas no card)
      // categories: união provider + serviços (usadas para busca/filtro)
      const serviceCategories = [...new Set(p.services.flatMap((s) => s.categories))];
      const searchCategories  = [...new Set([...p.categories, ...serviceCategories])];
      return {
        id: p.id,
        name: p.user.name,
        avatarUrl: p.user.avatarUrl ?? '/avatar.jpg',
        rating: Number(p.rating),
        price: this.getBasePrice(p.services),
        displayCategories: serviceCategories,
        categories: searchCategories,
      };
    });

    return {
      topProviders: formatted.slice(0, 6),
      categories: this.groupByCategory(formatted),
      allProviders: formatted,
    };
  }

  async getPublicProfile(id: string) {
    const provider = await this.repo.findById(id);
    if (!provider) throw new NotFoundException('Prestador não encontrado');

    return {
      id: provider.id,
      avatarUrl: provider.user.avatarUrl ?? '/avatar.jpg',
      bio: provider.user.bio ?? '',
      categories: provider.categories,
      isVerified: provider.isVerified,
      rating: Number(provider.rating),
      totalReviews: provider.totalReviews,
      user: { name: provider.user.name },
      services: provider.services.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description ?? '',
        price: s.price / 100,
        duration: s.duration,
      })),
      reviews: provider.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment ?? '',
        user: { name: r.user.name },
        services: { id: r.serviceId, title: r.service.title },
      })),
      images: provider.images.map((i) => i.url),
    };
  }

  async getMyProfile(firebaseUid: string) {
    const provider = await this.repo.findByFirebaseUid(firebaseUid);
    if (!provider) return { data: null };
    return {
      data: {
        id: provider.id,
        userId: provider.userId,
        categories: provider.categories,
        isVerified: provider.isVerified,
        rating: Number(provider.rating),
        totalReviews: provider.totalReviews,
        user: { name: provider.user.name, email: provider.user.email, avatarUrl: provider.user.avatarUrl },
        services: provider.services.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description ?? '',
          price: s.price,
          duration: s.duration,
        })),
      },
    };
  }

  async create(dto: CreateProviderDto) {
    await this.userRepo.update(dto.userId, { role: 'PROVIDER' } as any);
    return this.repo.create(dto.userId, dto.categories);
  }

  async update(id: string, dto: UpdateProviderDto) {
    await this.findOrFail(id);
    return this.repo.update(id, {
      ...(dto.categories && { categories: dto.categories }),
    });
  }

  async remove(id: string) {
    await this.findOrFail(id);
    return this.repo.softDelete(id);
  }

  async recalcRating(providerId: string) {
    const provider = await this.repo.findById(providerId);
    if (!provider) return;
    const reviews = provider.reviews;
    if (!reviews.length) return;
    const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await this.repo.updateRating(providerId, avg, reviews.length);
  }

  async addGalleryImage(firebaseUid: string, file: Express.Multer.File) {
    const provider = await this.repo.findByFirebaseUid(firebaseUid);
    if (!provider) throw new NotFoundException('Perfil de provider não encontrado');

    const currentCount = await this.mediaRepo.countByOwnerAndCategory(
      provider.userId,
      'PROVIDER_GALLERY',
    );
    if (currentCount >= MAX_GALLERY_IMAGES) {
      throw new BadRequestException(`Limite de ${MAX_GALLERY_IMAGES} imagens atingido`);
    }

    const { id: mediaId, url } = await this.mediaService.upload(
      file,
      'PROVIDER_GALLERY',
      provider.userId,
    );

    const sortOrder = provider.images.length;
    const providerImage = await this.repo.addImage(provider.id, url, sortOrder, mediaId);

    return { id: providerImage.id, url, mediaFileId: mediaId };
  }

  async removeGalleryImage(imageId: string, firebaseUid: string) {
    const provider = await this.repo.findByFirebaseUid(firebaseUid);
    if (!provider) throw new NotFoundException('Perfil de provider não encontrado');

    const image = provider.images.find((i) => i.id === imageId);
    if (!image) throw new NotFoundException('Imagem não encontrada na galeria');

    if ((image as any).mediaFileId) {
      const media = await this.mediaRepo.findById((image as any).mediaFileId);
      if (media) {
        if (media.ownerId !== provider.userId) throw new ForbiddenException('Sem permissão');
        await this.mediaService.deleteFromStorage(media.storageKey);
        await this.mediaRepo.softDelete(media.id);
      }
    }

    await this.repo.removeImage(imageId);
    return { message: 'Imagem removida com sucesso' };
  }

  private async findOrFail(id: string) {
    const provider = await this.repo.findById(id);
    if (!provider) throw new NotFoundException('Prestador não encontrado');
    return provider;
  }

  private getBasePrice(services: { price: number }[]): number {
    if (!services.length) return 0;
    return Math.min(...services.map((s) => s.price)) / 100;
  }

  private groupByCategory(providers: { displayCategories: string[]; categories: string[]; [k: string]: any }[]) {
    const map: Record<string, typeof providers> = {};
    providers.forEach((p) => {
      // Se o provider não tem categorias em serviços, usa a union (provider.categories)
      const cats = p.displayCategories.length ? p.displayCategories : p.categories;
      cats.forEach((cat) => {
        if (!map[cat]) map[cat] = [];
        map[cat].push(p);
      });
    });
    return Object.entries(map).map(([name, list]) => ({ name, providers: list }));
  }
}
