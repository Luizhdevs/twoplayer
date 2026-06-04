import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaRepository } from './media.repository';
import { STORAGE_SERVICE } from '../../storage/storage.interface';
import { MAX_IMAGE_SIZE, MAX_DOCUMENT_SIZE } from './media.constants';

const mockFile = (
  mimetype = 'image/jpeg',
  size = 1024 * 100,
): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype,
    size,
    buffer: Buffer.from('fake-image-data'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  } as Express.Multer.File);

const mockMedia = {
  id: 'media-uuid',
  ownerId: 'user-uuid',
  url: 'https://cdn.twoplayers.com/avatars/uuid.jpg',
  storageKey: 'avatars/uuid.jpg',
  mimeType: 'image/jpeg',
  fileSize: 1024,
  category: 'AVATAR' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepo: jest.Mocked<MediaRepository>;
  let storageService: { uploadFile: jest.Mock; deleteFile: jest.Mock; generateSignedUrl: jest.Mock };

  beforeEach(async () => {
    storageService = {
      uploadFile: jest.fn().mockResolvedValue({
        url: 'https://cdn.twoplayers.com/avatars/uuid.jpg',
        storageKey: 'avatars/uuid.jpg',
      }),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      generateSignedUrl: jest.fn().mockResolvedValue('https://signed.url'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: MediaRepository,
          useValue: {
            findById: jest.fn(),
            findByOwner: jest.fn(),
            findActiveAvatar: jest.fn(),
            create: jest.fn().mockResolvedValue(mockMedia),
            softDelete: jest.fn().mockResolvedValue(mockMedia),
            countByOwnerAndCategory: jest.fn().mockResolvedValue(0),
          },
        },
        { provide: STORAGE_SERVICE, useValue: storageService },
      ],
    }).compile();

    service  = module.get<MediaService>(MediaService);
    mediaRepo = module.get(MediaRepository);
  });

  // ── upload ──────────────────────────────────────────────────────────────────

  describe('upload()', () => {
    it('deve fazer upload de imagem jpeg válida', async () => {
      const file = mockFile('image/jpeg', 100_000);
      const result = await service.upload(file, 'AVATAR', 'user-uuid');
      expect(result).toEqual({ id: mockMedia.id, url: mockMedia.url });
      expect(storageService.uploadFile).toHaveBeenCalledWith(
        file.buffer, 'image/jpeg', 'avatars',
      );
    });

    it('deve fazer upload de imagem png válida', async () => {
      const file = mockFile('image/png', 500_000);
      await expect(service.upload(file, 'PROVIDER_GALLERY', 'user-uuid')).resolves.toBeDefined();
    });

    it('deve rejeitar tipo MIME não permitido', async () => {
      const file = mockFile('image/gif', 100_000);
      await expect(service.upload(file, 'AVATAR', 'user-uuid')).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar PDF em categoria AVATAR', async () => {
      const file = mockFile('application/pdf', 100_000);
      await expect(service.upload(file, 'AVATAR', 'user-uuid')).rejects.toThrow(BadRequestException);
    });

    it('deve aceitar PDF em categoria DOCUMENT', async () => {
      const file = mockFile('application/pdf', 1_000_000);
      await expect(service.upload(file, 'DOCUMENT', 'user-uuid')).resolves.toBeDefined();
    });

    it('deve rejeitar imagem acima de 5 MB', async () => {
      const file = mockFile('image/jpeg', MAX_IMAGE_SIZE + 1);
      await expect(service.upload(file, 'AVATAR', 'user-uuid')).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar documento acima de 20 MB', async () => {
      const file = mockFile('application/pdf', MAX_DOCUMENT_SIZE + 1);
      await expect(service.upload(file, 'DOCUMENT', 'user-uuid')).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar quando arquivo é undefined', async () => {
      await expect(service.upload(undefined as any, 'AVATAR', 'user-uuid')).rejects.toThrow(BadRequestException);
    });

    it('deve bloquear upload de galeria quando limite atingido', async () => {
      (mediaRepo.countByOwnerAndCategory as jest.Mock).mockResolvedValue(20);
      const file = mockFile('image/jpeg', 100_000);
      await expect(service.upload(file, 'PROVIDER_GALLERY', 'user-uuid')).rejects.toThrow(BadRequestException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('deve remover arquivo do dono', async () => {
      (mediaRepo.findById as jest.Mock).mockResolvedValue(mockMedia);
      const result = await service.remove(mockMedia.id, mockMedia.ownerId);
      expect(storageService.deleteFile).toHaveBeenCalledWith(mockMedia.storageKey);
      expect(result.message).toContain('removido');
    });

    it('deve lançar NotFoundException para arquivo inexistente', async () => {
      (mediaRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.remove('not-found', 'user-uuid')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException se não for o dono', async () => {
      (mediaRepo.findById as jest.Mock).mockResolvedValue(mockMedia);
      await expect(service.remove(mockMedia.id, 'outro-user')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── getSignedUrl ─────────────────────────────────────────────────────────────

  describe('getSignedUrl()', () => {
    it('deve retornar URL assinada para o dono', async () => {
      (mediaRepo.findById as jest.Mock).mockResolvedValue(mockMedia);
      const result = await service.getSignedUrl(mockMedia.id, mockMedia.ownerId);
      expect(result.url).toBe('https://signed.url');
    });

    it('deve lançar ForbiddenException se não for o dono', async () => {
      (mediaRepo.findById as jest.Mock).mockResolvedValue(mockMedia);
      await expect(service.getSignedUrl(mockMedia.id, 'outro-user')).rejects.toThrow(ForbiddenException);
    });
  });
});
