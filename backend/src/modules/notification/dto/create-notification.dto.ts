import { NotificationType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
