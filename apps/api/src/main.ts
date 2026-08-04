import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { buildCorsOptions } from './config/cors';

async function bootstrap(): Promise<void> {
  // rawBody: necessário para verificar a assinatura dos webhooks (§6.5)
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const logger = new Logger('Bootstrap');

  // Segurança de transporte/headers (§8): CSP, X-Frame-Options,
  // Referrer-Policy, HSTS (efetivo atrás de TLS em produção).
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      referrerPolicy: { policy: 'no-referrer' },
      // HSTS: força HTTPS por 1 ano (efetivo atrás de TLS)
      hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
      crossOriginResourcePolicy: { policy: 'same-site' },
      frameguard: { action: 'deny' },
    }),
  );
  app.use(cookieParser());

  // Permissions-Policy: desliga APIs sensíveis do browser (§8)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    );
    next();
  });

  // Limita o corpo das requisições (defesa contra payloads gigantes)
  app.useBodyParser('json', { limit: '1mb' });

  // CORS restrito às origens conhecidas (loja e admin), tolerante a barra
  // final e a previews da Vercel do mesmo projeto.
  app.enableCors(buildCorsOptions());

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
