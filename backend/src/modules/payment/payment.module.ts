import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { AppointmentModule } from '../appointment/appointment.module';
import { UserModule } from '../user/user.module';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [AppointmentModule, UserModule, forwardRef(() => EscrowModule)],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
