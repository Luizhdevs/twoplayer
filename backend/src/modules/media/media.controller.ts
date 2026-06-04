import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaCategory } from '@prisma/client';
import { MediaService } from './media.service';
import { UserRepository } from '../user/user.repository';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DecodedIdToken } from 'firebase-admin/auth';
import { ALLOWED_MIME_TYPES, MAX_DOCUMENT_SIZE } from './media.constants';

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    @Inject(forwardRef(() => UserRepository))
    private readonly userRepo: UserRepository,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_DOCUMENT_SIZE },
      fileFilter: (_req, file, cb) => {
        const ok = (ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype);
        cb(ok ? null : new BadRequestException('Tipo MIME não permitido'), ok);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category: string,
    @CurrentUser() firebaseUser: DecodedIdToken,
  ) {
    if (!category || !(category in MediaCategory)) {
      throw new BadRequestException(
        `category inválido. Valores: ${Object.values(MediaCategory).join(', ')}`,
      );
    }
    const user = await this.userRepo.findByFirebaseUid(firebaseUser.uid);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.mediaService.upload(file, category as MediaCategory, user.id);
  }

  @Get('mine')
  findMine(
    @CurrentUser() user: DecodedIdToken,
    @Query('category') category?: MediaCategory,
  ) {
    return this.mediaService.findByOwner(user.uid, category);
  }

  @Get(':id/signed-url')
  getSignedUrl(
    @Param('id') id: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.mediaService.getSignedUrl(id, user.uid);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: DecodedIdToken) {
    return this.mediaService.remove(id, user.uid);
  }
}
