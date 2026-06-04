import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProviderService } from './provider.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DecodedIdToken } from 'firebase-admin/auth';
import { ALLOWED_MIME_TYPES, MAX_IMAGE_SIZE } from '../media/media.constants';

@Controller('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Public()
  @Get()
  getHome() {
    return this.providerService.getHome();
  }

  @Get('me')
  getMyProfile(@CurrentUser() user: DecodedIdToken) {
    return this.providerService.getMyProfile(user.uid);
  }

  @Public()
  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.providerService.getPublicProfile(id);
  }

  @Post('me/gallery')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_SIZE },
      fileFilter: (_req, file, cb) => {
        const imageTypes = ALLOWED_MIME_TYPES.filter((m) => m !== 'application/pdf');
        const ok = imageTypes.includes(file.mimetype as any);
        cb(ok ? null : new BadRequestException('Galeria aceita apenas jpg, png ou webp'), ok);
      },
    }),
  )
  addGalleryImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.providerService.addGalleryImage(user.uid, file);
  }

  @Delete('me/gallery/:imageId')
  removeGalleryImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.providerService.removeGalleryImage(imageId, user.uid);
  }

  @Post()
  create(@Body() dto: CreateProviderDto) {
    return this.providerService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.providerService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.providerService.remove(id);
  }
}
