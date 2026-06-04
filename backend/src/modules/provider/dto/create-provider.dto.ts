import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateProviderDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @IsString({ each: true })
  categories: string[];
}
