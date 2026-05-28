import { Controller, Get, Param } from '@nestjs/common';
import { ProviderService } from './provider.service';

@Controller('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Get(':id')
  getProvider(@Param('id') id: string) {
    return this.providerService.getPublicProfile(Number(id));
  }

  @Get()
  getHomeProviders() {
    return this.providerService.getHome();
  }
}
