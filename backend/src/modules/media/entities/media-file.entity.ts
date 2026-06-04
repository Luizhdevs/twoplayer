import { MediaCategory } from '@prisma/client';

export class MediaFileEntity {
  id: string;
  ownerId: string;
  url: string;
  storageKey: string;
  mimeType: string | null;
  fileSize: number | null;
  category: MediaCategory;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
