import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { FirebaseAuthGuard } from './common/guards/firebase-auth.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { StorageModule } from './storage/storage.module';
import { UserModule } from './modules/user/user.module';
import { ProviderModule } from './modules/provider/provider.module';
import { ServiceModule } from './modules/service/service.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { ReviewModule } from './modules/review/review.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { NotificationModule } from './modules/notification/notification.module';
import { MediaModule } from './modules/media/media.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { MercadoPagoModule } from './mercadopago/mercadopago.module';
import { PaymentModule } from './modules/payment/payment.module';
import { EscrowModule } from './modules/escrow/escrow.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    StorageModule,
    MercadoPagoModule,
    MediaModule,
    UserModule,
    ProviderModule,
    ServiceModule,
    AvailabilityModule,
    AppointmentModule,
    ReviewModule,
    WalletModule,
    NotificationModule,
    PaymentModule,
    EscrowModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD,       useClass: FirebaseAuthGuard },
    { provide: APP_FILTER,      useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
  ],
})
export class AppModule {}
