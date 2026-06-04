import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { TIME_REGEX } from '../availability.constants';

export class AvailabilitySlotDto {
  @IsInt()
  @Min(0, { message: 'weekday: 0 = domingo, 6 = sábado' })
  @Max(6, { message: 'weekday: 0 = domingo, 6 = sábado' })
  weekday: number;

  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: 'startTime deve estar no formato HH:mm' })
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: 'endTime deve estar no formato HH:mm' })
  endTime: string;
}
