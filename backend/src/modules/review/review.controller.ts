import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Public()
  @Get('provider/:providerId')
  findAllByProvider(@Param('providerId') providerId: string) {
    return this.reviewService.findAllByProvider(providerId);
  }

  @Post()
  create(@Body() dto: CreateReviewDto) {
    return this.reviewService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }
}
