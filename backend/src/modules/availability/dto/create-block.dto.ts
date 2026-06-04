import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBlockDto {
  @IsDateString()
  @IsNotEmpty()
  startDateTime: string;

  @IsDateString()
  @IsNotEmpty()
  endDateTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
