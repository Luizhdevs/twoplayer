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
    const endpoint  = process.env.R2_ENDPOINT;
    const accessKey = process.env.R2_ACCESS_KEY_ID     ?? '';
    const secretKey = process.env.R2_SECRET_ACCESS_KEY ?? '';

    this.bucket    = process.env.R2_BUCKET_NAME ?? '';
    this.publicUrl = process.env.R2_PUBLIC_URL  ?? '';

    if (!endpoint || !accessKey || !secretKey || !this.bucket) {
      this.logger.error(
        `R2 config incompleta — endpoint=${endpoint ?? 'MISSING'} bucket=${this.bucket || 'MISSING'} keyId=${accessKey ? 'ok' : 'MISSING'}`,
      );
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      // Cloudflare R2 compatibility: disable automatic checksum headers
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    } as any);

    this.logger.log(`Storage conectado ao bucket "${this.bucket}" endpoint="${endpoint ?? 'undefined'}"`);
  }

  async uploadFile(
    buffer: Buffer,
    mimeType: string,
    folder: string,
  ): Promise<UploadResult> {
    const ext = MIME_TO_EXT[mimeType] ?? 'bin';
    const storageKey = `${folder}/${uuidv4()}.${ext}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket:      this.bucket,
          Key:         storageKey,
          Body:        buffer,
          ContentType: mimeType,
        }),
      );
    } catch (err: any) {
      this.logger.error(`R2 upload failed — key=${storageKey} bucket=${this.bucket}: ${err?.message ?? err}`);
      throw err;
    }

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
