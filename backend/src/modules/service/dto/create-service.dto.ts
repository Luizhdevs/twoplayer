import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsUUID()
  @IsNotEmpty()
  providerId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  price: number;

  @IsInt()
  @Min(1)
  duration: number;
}
