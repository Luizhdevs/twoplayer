import { Global, Module } from '@nestjs/common';
import { R2StorageService } from './r2-storage.service';
import { LocalStorageService } from './local-storage.service';
import { STORAGE_SERVICE } from './storage.interface';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      useFactory: () => {
        const hasR2 =
          !!process.env.R2_ACCOUNT_ID &&
          !!process.env.R2_ACCESS_KEY_ID &&
          !!process.env.R2_SECRET_ACCESS_KEY;
        return hasR2 ? new R2StorageService() : new LocalStorageService();
      },
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
