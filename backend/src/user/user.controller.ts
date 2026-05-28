import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id/profile')
  getProfile(@Param('id') id: string) {
    return this.userService.getProfile(Number(id));
  }
}
