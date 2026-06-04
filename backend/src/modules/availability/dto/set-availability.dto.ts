import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { AvailabilitySlotDto } from './availability-slot.dto';

export class SetAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  schedule: AvailabilitySlotDto[];
}
