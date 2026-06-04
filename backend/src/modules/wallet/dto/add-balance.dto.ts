import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddBalanceDto {
  @IsInt()
  @Min(100)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;
}
