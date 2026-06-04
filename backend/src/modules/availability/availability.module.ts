import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { AvailabilityRepository } from './availability.repository';
import { BlockRepository } from './block.repository';
import { ProviderModule } from '../provider/provider.module';

@Module({
  imports: [ProviderModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, AvailabilityRepository, BlockRepository],
  exports: [AvailabilityService, AvailabilityRepository, BlockRepository],
})
export class AvailabilityModule {}
