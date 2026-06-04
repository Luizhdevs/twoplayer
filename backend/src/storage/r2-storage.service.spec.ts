import { Test, TestingModule } from '@nestjs/testing';
import { R2StorageService } from './r2-storage.service';

// Mocks antes de importar o módulo
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand:    jest.fn(),
  DeleteObjectCommand: jest.fn(),
  GetObjectCommand:    jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed.r2.url/key.jpg'),
}));

describe('R2StorageService', () => {
  let service: R2StorageService;

  beforeEach(async () => {
    process.env.R2_BUCKET_NAME     = 'twoplayers-dev';
    process.env.R2_PUBLIC_URL      = 'https://cdn.twoplayers.com';
    process.env.R2_ENDPOINT        = 'https://account.r2.cloudflarestorage.com';
    process.env.R2_ACCESS_KEY_ID   = 'test-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [R2StorageService],
    }).compile();

    service = module.get<R2StorageService>(R2StorageService);
    service.onModuleInit();
  });

  describe('uploadFile()', () => {
    it('deve retornar url e storageKey corretos para jpeg', async () => {
      const buffer = Buffer.from('fake-data');
      const result = await service.uploadFile(buffer, 'image/jpeg', 'avatars');

      expect(result.url).toMatch(/^https:\/\/cdn\.twoplayers\.com\/avatars\/.+\.jpg$/);
      expect(result.storageKey).toMatch(/^avatars\/.+\.jpg$/);
    });

    it('deve retornar extensão png para image/png', async () => {
      const result = await service.uploadFile(Buffer.from(''), 'image/png', 'providers/gallery');
      expect(result.storageKey).toMatch(/\.png$/);
    });

    it('deve retornar extensão pdf para application/pdf', async () => {
      const result = await service.uploadFile(Buffer.from(''), 'application/pdf', 'documents');
      expect(result.storageKey).toMatch(/\.pdf$/);
    });

    it('deve gerar chaves únicas em uploads consecutivos', async () => {
      const r1 = await service.uploadFile(Buffer.from(''), 'image/jpeg', 'avatars');
      const r2 = await service.uploadFile(Buffer.from(''), 'image/jpeg', 'avatars');
      expect(r1.storageKey).not.toBe(r2.storageKey);
    });
  });

  describe('deleteFile()', () => {
    it('deve deletar sem lançar exceção', async () => {
      await expect(service.deleteFile('avatars/uuid.jpg')).resolves.toBeUndefined();
    });

    it('não deve propagar erro se S3 falhar', async () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      S3Client.mockImplementationOnce(() => ({
        send: jest.fn().mockRejectedValue(new Error('S3 error')),
      }));
      service.onModuleInit();
      await expect(service.deleteFile('avatars/uuid.jpg')).resolves.toBeUndefined();
    });
  });

  describe('generateSignedUrl()', () => {
    it('deve retornar URL assinada', async () => {
      const url = await service.generateSignedUrl('avatars/uuid.jpg');
      expect(url).toBe('https://signed.r2.url/key.jpg');
    });

    it('deve aceitar expiresIn customizado', async () => {
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      await service.generateSignedUrl('key.jpg', 7200);
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 7200 },
      );
    });
  });
});
