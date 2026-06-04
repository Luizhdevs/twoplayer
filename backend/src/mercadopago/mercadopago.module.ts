import { Global, Module } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { MP_SERVICE } from './mercadopago.interface';

@Global()
@Module({
  providers: [
    MercadoPagoService,
    { provide: MP_SERVICE, useExisting: MercadoPagoService },
  ],
  exports: [MercadoPagoService, MP_SERVICE],
})
export class MercadoPagoModule {}
