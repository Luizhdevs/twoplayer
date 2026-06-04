import { Module } from '@nestjs/common';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';
import { ProviderRepository } from './provider.repository';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [ProviderController],
  providers: [ProviderService, ProviderRepository],
  exports: [ProviderService, ProviderRepository],
})
export class ProviderModule {}
