import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DecodedIdToken } from 'firebase-admin/auth';
import { UserRepository } from '../user/user.repository';
import { ProviderRepository } from '../provider/provider.repository';

@Controller('appointments')
export class EscrowController {
  constructor(
    private readonly escrowService:  EscrowService,
    private readonly userRepo:       UserRepository,
    private readonly providerRepo:   ProviderRepository,
  ) {}

  // ── FASE 4: Provider confirma  ─────────────────────────────────────────

  @Post(':id/confirm')
  async confirm(
    @Param('id') appointmentId: string,
    @CurrentUser() firebaseUser: DecodedIdToken,
  ) {
    const provider = await this.resolveProvider(firebaseUser.uid);
    return this.escrowService.confirmAppointment(appointmentId, provider.userId);
  }

  // ── FASE 5: Provider inicia serviço ─────────────────────────────────────

  @Post(':id/start')
  async start(
    @Param('id') appointmentId: string,
    @CurrentUser() firebaseUser: DecodedIdToken,
  ) {
    const provider = await this.resolveProvider(firebaseUser.uid);
    return this.escrowService.startAppointment(appointmentId, provider.userId);
  }

  // ── FASE 6: Provider finaliza serviço ───────────────────────────────────

  @Post(':id/finish')
  async finish(
    @Param('id') appointmentId: string,
    @CurrentUser() firebaseUser: DecodedIdToken,
  ) {
    const provider = await this.resolveProvider(firebaseUser.uid);
    return this.escrowService.finishAppointment(appointmentId, provider.userId);
  }

  // ── FASE 7: Cliente aprova execução ─────────────────────────────────────

  @Post(':id/approve')
  async approve(
    @Param('id') appointmentId: string,
    @CurrentUser() firebaseUser: DecodedIdToken,
  ) {
    const user = await this.resolveUser(firebaseUser.uid);
    return this.escrowService.approveAppointment(appointmentId, user.id);
  }

  // ── Consultas de auditoria ───────────────────────────────────────────────

  @Get(':id/events')
  getEvents(@Param('id') appointmentId: string) {
    return this.escrowService.getEvents(appointmentId);
  }

  @Get(':id/escrow')
  getEscrow(@Param('id') appointmentId: string) {
    return this.escrowService.getByAppointmentId(appointmentId);
  }

  // ── Helpers privados ────────────────────────────────────────────────────

  private async resolveUser(firebaseUid: string) {
    const user = await this.userRepo.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  private async resolveProvider(firebaseUid: string) {
    const user = await this.userRepo.findByFirebaseUid(firebaseUid);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const provider = await this.providerRepo.findByUserId(user.id);
    if (!provider) throw new NotFoundException('Perfil de provider não encontrado');
    return provider;
  }
}
