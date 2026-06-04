export interface UploadResult {
  url: string;
  storageKey: string;
}

export interface IStorageService {
  uploadFile(buffer: Buffer, mimeType: string, folder: string): Promise<UploadResult>;
  deleteFile(storageKey: string): Promise<void>;
  generateSignedUrl(storageKey: string, expiresIn?: number): Promise<string>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
