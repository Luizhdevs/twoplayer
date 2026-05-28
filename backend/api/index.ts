import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import * as express from 'express';
import type { Request, Response } from 'express';

const server = express();
let isReady = false;

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    { logger: ['error', 'warn'] },
  );
  app.enableCors({ origin: '*' });
  await app.init();
  isReady = true;
}

const ready = bootstrap();

export default async function handler(req: Request, res: Response) {
  await ready;
  server(req, res);
}
