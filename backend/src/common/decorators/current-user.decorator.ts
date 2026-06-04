import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/auth';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DecodedIdToken => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as DecodedIdToken;
  },
);
