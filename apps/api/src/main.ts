import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // Segurança de transporte/headers (§8): CSP, X-Frame-Options,
  // Referrer-Policy, HSTS (efetivo atrás de TLS em produção).
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.use(cookieParser());

  // CORS restrito às origens conhecidas (loja e admin)
  const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
  const adminUrl = process.env.ADMIN_URL ?? 'http://localhost:3001';
  app.enableCors({ origin: [webUrl, adminUrl], credentials: true });

  // Validação estrita por DTO (§8): whitelist remove campos não declarados.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
  app.disable('x-powered-by');

  const port = parseInt(process.env.API_PORT ?? '3333', 10);
  await app.listen(port);
  logger.log(`API no ar em http://localhost:${port} (health: /health)`);
}

void bootstrap();
