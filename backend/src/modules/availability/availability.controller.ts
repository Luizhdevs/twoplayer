import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { DecodedIdToken } from 'firebase-admin/auth';
import { ProviderRepository } from '../provider/provider.repository';
import { NotFoundException } from '@nestjs/common';

@Controller('providers')
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly providerRepo: ProviderRepository,
  ) {}

  // ── Disponibilidade semanal ────────────────────────────────────────────────

  @Get('me/availability')
  async getMyAvailability(@CurrentUser() user: DecodedIdToken) {
    const provider = await this.resolveProvider(user.uid);
    return this.availabilityService.getAvailability(provider.id);
  }

  @Put('me/availability')
  async setMyAvailability(
    @Body() dto: SetAvailabilityDto,
    @CurrentUser() user: DecodedIdToken,
  ) {
    const provider = await this.resolveProvider(user.uid);
    return this.availabilityService.setAvailability(provider.id, dto);
  }

  // ── Bloqueios ─────────────────────────────────────────────────────────────

  @Get('me/blocks')
  async getMyBlocks(@CurrentUser() user: DecodedIdToken) {
    const provider = await this.resolveProvider(user.uid);
    return this.availabilityService.getBlocks(provider.id);
  }

  @Post('me/blocks')
  async createBlock(
    @Body() dto: CreateBlockDto,
    @CurrentUser() user: DecodedIdToken,
  ) {
    const provider = await this.resolveProvider(user.uid);
    return this.availabilityService.createBlock(provider.id, dto);
  }

  @Delete('me/blocks/:id')
  async removeBlock(
    @Param('id') blockId: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    const provider = await this.resolveProvider(user.uid);
    return this.availabilityService.removeBlock(blockId, provider.id);
  }

  // ── Slots disponíveis (público) ───────────────────────────────────────────

  @Public()
  @Get(':providerId/available-slots')
  getAvailableSlots(
    @Param('providerId') providerId: string,
    @Query('date') date: string,
  ) {
    return this.availabilityService.getAvailableSlots(providerId, date);
  }

  // ── Helper privado ────────────────────────────────────────────────────────

  private async resolveProvider(firebaseUid: string) {
    const provider = await this.providerRepo.findByUserId(firebaseUid);
    if (!provider) {
      throw new NotFoundException('Perfil de prestador não encontrado para este usuário');
    }
    return provider;
  }
}
