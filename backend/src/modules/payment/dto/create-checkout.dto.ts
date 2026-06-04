import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateCheckoutDto {
  @IsUUID()
  @IsNotEmpty()
  appointmentId: string;
}
