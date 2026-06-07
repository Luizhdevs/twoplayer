import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { IStorageService, UploadResult } from './storage.interface';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

@Injectable()
export class LocalStorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(LocalStorageService.name);
  private uploadsDir: string;
  private baseUrl: string;

  onModuleInit() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.baseUrl = `http://localhost:${process.env.PORT ?? 3001}/uploads`;

    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    this.logger.warn('[Dev] R2 não configurado — usando armazenamento local em: ' + this.uploadsDir);
  }

  async uploadFile(buffer: Buffer, mimeType: string, folder: string): Promise<UploadResult> {
    const ext = MIME_TO_EXT[mimeType] ?? 'bin';
    const storageKey = `${folder}/${uuidv4()}.${ext}`;
    const folderPath = path.join(this.uploadsDir, folder);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    fs.writeFileSync(path.join(this.uploadsDir, storageKey), buffer);
    this.logger.log(`[Dev] Upload: ${storageKey}`);

    return { url: `${this.baseUrl}/${storageKey}`, storageKey };
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadsDir, storageKey);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      this.logger.log(`[Dev] Deletado: ${storageKey}`);
    } catch (err) {
      this.logger.error(`[Dev] Falha ao deletar ${storageKey}`, err);
    }
  }

  async generateSignedUrl(storageKey: string): Promise<string> {
    return `${this.baseUrl}/${storageKey}`;
  }
}
