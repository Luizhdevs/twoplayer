import { MediaCategory } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UploadMediaDto {
  @IsEnum(MediaCategory, {
    message: `category deve ser: ${Object.values(MediaCategory).join(', ')}`,
  })
  @IsNotEmpty()
  category: MediaCategory;
}
