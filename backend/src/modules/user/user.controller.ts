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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DecodedIdToken } from 'firebase-admin/auth';
import { ALLOWED_MIME_TYPES, MAX_IMAGE_SIZE } from '../media/media.constants';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Public()
  @Get(':id/profile')
  getProfile(@Param('id') id: string) {
    return this.userService.getProfile(id);
  }

  @Get('me')
  getMe(@CurrentUser() user: DecodedIdToken) {
    return this.userService.findByFirebaseUid(user.uid);
  }

  @Patch('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_SIZE },
      fileFilter: (_req, file, cb) => {
        const imageTypes = ALLOWED_MIME_TYPES.filter((m) => m !== 'application/pdf');
        const ok = imageTypes.includes(file.mimetype as any);
        cb(ok ? null : new BadRequestException('Avatar deve ser jpg, png ou webp'), ok);
      },
    }),
  )
  updateAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.userService.updateAvatar(file, user.uid);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
