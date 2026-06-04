import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class WithdrawDto {
  @IsInt()
  @Min(100)
  amount: number;

  @IsString()
  @IsNotEmpty()
  pixKey: string;
}
