import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaCategory } from '@prisma/client';
import { IStorageService, STORAGE_SERVICE } from '../../storage/storage.interface';
import { MediaRepository } from './media.repository';
import {
  ALLOWED_MIME_TYPES,
  CATEGORY_ALLOWED_MIMES,
  CATEGORY_TO_FOLDER,
  MAX_DOCUMENT_SIZE,
  MAX_GALLERY_IMAGES,
  MAX_IMAGE_SIZE,
} from './media.constants';

@Injectable()
export class MediaService {
  constructor(
    private readonly repo: MediaRepository,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async upload(
    file: Express.Multer.File,
    category: MediaCategory,
    ownerId: string,
  ) {
    this.validateFile(file, category);

    if (category === 'PROVIDER_GALLERY') {
      const count = await this.repo.countByOwnerAndCategory(ownerId, category);
      if (count >= MAX_GALLERY_IMAGES) {
        throw new BadRequestException(`Limite de ${MAX_GALLERY_IMAGES} imagens na galeria atingido`);
      }
    }

    const folder = CATEGORY_TO_FOLDER[category];
    const { url, storageKey } = await this.storage.uploadFile(
      file.buffer,
      file.mimetype,
      folder,
    );

    const media = await this.repo.create({
      ownerId,
      url,
      storageKey,
      mimeType: file.mimetype,
      fileSize: file.size,
      category,
    });

    return { id: media.id, url: media.url };
  }

  async remove(id: string, requesterId: string) {
    const media = await this.repo.findById(id);
    if (!media) throw new NotFoundException('Arquivo não encontrado');
    if (media.ownerId !== requesterId) throw new ForbiddenException('Sem permissão para remover este arquivo');

    await this.storage.deleteFile(media.storageKey);
    await this.repo.softDelete(id);

    return { message: 'Arquivo removido com sucesso' };
  }

  async getSignedUrl(id: string, requesterId: string) {
    const media = await this.repo.findById(id);
    if (!media) throw new NotFoundException('Arquivo não encontrado');
    if (media.ownerId !== requesterId) throw new ForbiddenException('Sem permissão');
    return { url: await this.storage.generateSignedUrl(media.storageKey) };
  }

  findByOwner(ownerId: string, category?: MediaCategory) {
    return this.repo.findByOwner(ownerId, category);
  }

  async deleteFromStorage(storageKey: string) {
    await this.storage.deleteFile(storageKey);
  }

  // ── Validação centralizada ─────────────────────────────────────────────────

  private validateFile(file: Express.Multer.File, category: MediaCategory) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');

    const allowed = ALLOWED_MIME_TYPES as readonly string[];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    const categoryAllowed = CATEGORY_ALLOWED_MIMES[category] as string[];
    if (!categoryAllowed.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo "${file.mimetype}" não é permitido para categoria "${category}"`,
      );
    }

    const isDocument = file.mimetype === 'application/pdf';
    const sizeLimit  = isDocument ? MAX_DOCUMENT_SIZE : MAX_IMAGE_SIZE;

    if (file.size > sizeLimit) {
      const mb = sizeLimit / 1024 / 1024;
      throw new BadRequestException(`Arquivo excede o limite de ${mb} MB`);
    }
  }
}
