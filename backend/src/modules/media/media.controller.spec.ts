import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

const mockUser = { uid: 'user-firebase-uid', email: 'test@test.com' };

const mockFile = (mimetype = 'image/jpeg', size = 100_000): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype,
    size,
    buffer: Buffer.from('fake'),
  } as Express.Multer.File);

describe('MediaController', () => {
  let controller: MediaController;
  let mediaService: jest.Mocked<MediaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: MediaService,
          useValue: {
            upload:         jest.fn().mockResolvedValue({ id: 'uuid', url: 'https://cdn/file.jpg' }),
            remove:         jest.fn().mockResolvedValue({ message: 'Arquivo removido com sucesso' }),
            getSignedUrl:   jest.fn().mockResolvedValue({ url: 'https://signed.url' }),
            findByOwner:    jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller  = module.get<MediaController>(MediaController);
    mediaService = module.get(MediaService);
  });

  describe('upload()', () => {
    it('deve chamar service.upload com categoria válida', async () => {
      const result = await controller.upload(
        mockFile(),
        'AVATAR',
        mockUser as any,
      );
      expect(mediaService.upload).toHaveBeenCalledWith(
        expect.any(Object),
        'AVATAR',
        mockUser.uid,
      );
      expect(result).toEqual({ id: 'uuid', url: 'https://cdn/file.jpg' });
    });

    it('deve lançar BadRequestException para categoria inválida', async () => {
      await expect(
        controller.upload(mockFile(), 'CATEGORIA_INVALIDA', mockUser as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove()', () => {
    it('deve chamar service.remove com id e uid corretos', async () => {
      const result = await controller.remove('media-id', mockUser as any);
      expect(mediaService.remove).toHaveBeenCalledWith('media-id', mockUser.uid);
      expect(result.message).toContain('removido');
    });
  });

  describe('getSignedUrl()', () => {
    it('deve retornar URL assinada', async () => {
      const result = await controller.getSignedUrl('media-id', mockUser as any);
      expect(result.url).toBe('https://signed.url');
    });
  });

  describe('findMine()', () => {
    it('deve listar arquivos do usuário', async () => {
      const result = await controller.findMine(mockUser as any);
      expect(mediaService.findByOwner).toHaveBeenCalledWith(mockUser.uid, undefined);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
