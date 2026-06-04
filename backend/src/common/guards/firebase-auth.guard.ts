import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as admin from 'firebase-admin';
import { Request } from 'express';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Token não fornecido');

    // Modo dev: sem credenciais Firebase configuradas — aceita qualquer token
    const hasFirebaseCreds = !!process.env.FIREBASE_PROJECT_ID && !!process.env.FIREBASE_CLIENT_EMAIL;
    if (!hasFirebaseCreds) {
      (req as any).user = { uid: token, email: 'dev@twoplayers.com' };
      return true;
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      (req as any).user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private extractToken(req: Request): string | null {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
