import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { AppointmentRepository } from '../appointment/appointment.repository';
import { ProviderRepository } from '../provider/provider.repository';

@Injectable()
export class ReviewService {
  constructor(
    private readonly repo: ReviewRepository,
    private readonly appointmentRepo: AppointmentRepository,
    private readonly providerRepo: ProviderRepository,
  ) {}

  findAllByProvider(providerId: string) {
    return this.repo.findAllByProvider(providerId);
  }

  async create(dto: CreateReviewDto) {
    const appointment = await this.appointmentRepo.findById(dto.appointmentId);
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Só é possível avaliar agendamentos concluídos',
      );
    }

    const alreadyReviewed = await this.repo.findByAppointment(dto.appointmentId);
    if (alreadyReviewed) throw new ConflictException('Agendamento já avaliado');

    const review = await this.repo.create(
      dto,
      appointment.userId,
      appointment.providerId,
      appointment.serviceId,
    );

    await this.recalcProviderRating(appointment.providerId);

    return review;
  }

  async remove(id: string) {
    const review = await this.repo.findById(id);
    if (!review) throw new NotFoundException('Avaliação não encontrada');
    await this.repo.softDelete(id);
    await this.recalcProviderRating(review.providerId);
    return { message: 'Avaliação removida' };
  }

  private async recalcProviderRating(providerId: string) {
    const { avg, count } = await this.repo.getAverageRating(providerId);
    await this.providerRepo.updateRating(providerId, avg, count);
  }
}
