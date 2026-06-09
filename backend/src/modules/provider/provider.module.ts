import { Module } from '@nestjs/common';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';
import { ProviderRepository } from './provider.repository';
import { MediaModule } from '../media/media.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [MediaModule, UserModule],
  controllers: [ProviderController],
  providers: [ProviderService, ProviderRepository],
  exports: [ProviderService, ProviderRepository],
})
export class ProviderModule {}
