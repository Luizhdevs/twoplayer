import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewRepository } from './review.repository';
import { AppointmentModule } from '../appointment/appointment.module';
import { ProviderModule } from '../provider/provider.module';

@Module({
  imports: [AppointmentModule, ProviderModule],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository],
  exports: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
