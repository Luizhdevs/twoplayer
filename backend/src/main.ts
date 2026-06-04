/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as admin from 'firebase-admin';

async function bootstrap() {
  if (!admin.apps.length) {
    const projectId   = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      // Dev/CI: Firebase sem credenciais — auth guard em modo permissivo
      console.warn('[Firebase] Credenciais não configuradas — FirebaseAuthGuard desativado');
      admin.initializeApp({ projectId: 'twoplayers-dev' });
    }
  }

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
