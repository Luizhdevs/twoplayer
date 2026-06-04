import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsUUID()
  @IsNotEmpty()
  providerId: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
