import { Injectable, NotFoundException } from '@nestjs/common';
import { ServiceRepository } from './service.repository';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly repo: ServiceRepository) {}

  findAllByProvider(providerId: string) {
    return this.repo.findAllByProvider(providerId);
  }

  async findById(id: string) {
    const svc = await this.repo.findById(id);
    if (!svc) throw new NotFoundException('Serviço não encontrado');
    return svc;
  }

  create(dto: CreateServiceDto) {
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findById(id);
    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repo.softDelete(id);
  }
}
