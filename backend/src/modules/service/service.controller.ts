import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Public()
  @Get('provider/:providerId')
  findAllByProvider(@Param('providerId') providerId: string) {
    return this.serviceService.findAllByProvider(providerId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.serviceService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.serviceService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }
}
