import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { MpWebhookBody } from './dto/mp-webhook.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { DecodedIdToken } from 'firebase-admin/auth';
import { UserRepository } from '../user/user.repository';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly userRepo: UserRepository,
  ) {}

  // ── POST /payments/create-checkout ───────────────────────────────────────

  @Post('create-checkout')
  async createCheckout(
    @Body() dto: CreateCheckoutDto,
    @CurrentUser() firebaseUser: DecodedIdToken,
  ) {
    const user = await this.userRepo.findByFirebaseUid(firebaseUser.uid);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.paymentService.createCheckout(user.id, dto);
  }

  // ── POST /payments/:appointmentId/simulate-success ───────────────────────

  @Post(':appointmentId/simulate-success')
  async simulateSuccess(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() firebaseUser: DecodedIdToken,
  ) {
    const user = await this.userRepo.findByFirebaseUid(firebaseUser.uid);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.paymentService.simulateSuccess(user.id, appointmentId);
  }

  // ── POST /payments/webhook (público — chamado pelo Mercado Pago) ─────────

  @Public()
  @Post('webhook')
  handleWebhook(
    @Headers('x-signature')  xSignature: string,
    @Headers('x-request-id') xRequestId: string,
    @Body() body: MpWebhookBody,
  ) {
    return this.paymentService.handleWebhook(xSignature, xRequestId, body);
  }

  // ── GET /payments/appointment/:appointmentId ──────────────────────────────

  @Get('appointment/:appointmentId')
  findByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.paymentService.findByAppointmentId(appointmentId);
  }

  // ── GET /payments/:id ─────────────────────────────────────────────────────

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findById(id);
  }
}
