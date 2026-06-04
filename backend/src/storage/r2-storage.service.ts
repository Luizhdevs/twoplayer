import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { IStorageService, UploadResult } from './storage.interface';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

@Injectable()
export class R2StorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(R2StorageService.name);
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  onModuleInit() {
    this.bucket    = process.env.R2_BUCKET_NAME ?? '';
    this.publicUrl = process.env.R2_PUBLIC_URL  ?? '';

    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId:     process.env.R2_ACCESS_KEY_ID     ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    });

    this.logger.log(`Storage conectado ao bucket "${this.bucket}"`);
  }

  async uploadFile(
    buffer: Buffer,
    mimeType: string,
    folder: string,
  ): Promise<UploadResult> {
    const ext = MIME_TO_EXT[mimeType] ?? 'bin';
    const storageKey = `${folder}/${uuidv4()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket:      this.bucket,
        Key:         storageKey,
        Body:        buffer,
        ContentType: mimeType,
      }),
    );

    this.logger.log(`Uploaded: ${storageKey}`);
    return { url: `${this.publicUrl}/${storageKey}`, storageKey };
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      );
      this.logger.log(`Deleted: ${storageKey}`);
    } catch (err) {
      this.logger.error(`Failed to delete ${storageKey}`, err);
    }
  }

  async generateSignedUrl(
    storageKey: string,
    expiresIn = 3600,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      { expiresIn },
    );
  }
}
