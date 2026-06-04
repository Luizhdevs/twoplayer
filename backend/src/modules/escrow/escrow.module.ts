import { Module, forwardRef } from '@nestjs/common';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { EscrowRepository } from './escrow.repository';
import { EventRepository } from './event.repository';
import { AutoReleaseJob } from './auto-release.job';
import { UserModule } from '../user/user.module';
import { ProviderModule } from '../provider/provider.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [UserModule, ProviderModule, forwardRef(() => PaymentModule)],
  controllers: [EscrowController],
  providers: [
    EscrowService,
    EscrowRepository,
    EventRepository,
    AutoReleaseJob,
  ],
  exports: [EscrowService, EscrowRepository, EventRepository],
})
export class EscrowModule {}
