import { forwardRef, Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaRepository } from './media.repository';
import { UserModule } from '../user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [MediaController],
  providers: [MediaService, MediaRepository],
  exports: [MediaService, MediaRepository],
})
export class MediaModule {}
