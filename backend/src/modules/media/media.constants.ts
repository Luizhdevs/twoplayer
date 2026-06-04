import { MediaCategory } from '@prisma/client';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const IMAGE_MIME_TYPES: AllowedMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_GALLERY_IMAGES = 20;

export const CATEGORY_TO_FOLDER: Record<MediaCategory, string> = {
  AVATAR:           'avatars',
  PROVIDER_GALLERY: 'providers/gallery',
  SERVICE_GALLERY:  'services/gallery',
  DISPUTE_EVIDENCE: 'disputes',
  DOCUMENT:         'documents',
};

export const CATEGORY_ALLOWED_MIMES: Record<MediaCategory, AllowedMimeType[]> = {
  AVATAR:           IMAGE_MIME_TYPES,
  PROVIDER_GALLERY: IMAGE_MIME_TYPES,
  SERVICE_GALLERY:  IMAGE_MIME_TYPES,
  DISPUTE_EVIDENCE: [...IMAGE_MIME_TYPES, 'application/pdf'],
  DOCUMENT:         ['application/pdf'],
};
