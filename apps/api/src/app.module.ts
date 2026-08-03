import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { appConfig, securityConfig } from './config/app.config';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './infra/prisma/prisma.module';
import { CryptoModule } from './infra/crypto/crypto.module';
import { RedisModule } from './infra/redis/redis.module';
import { AuthModule } from './common/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartModule } from './modules/cart/cart.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { ShippingModule } from './modules/shipping/shipping.module';

/**
 * Monólito modular (§3). Módulos de domínio entram por milestone; identity é
 * o M1. TokenService/guards ficam no AuthModule global.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, securityConfig],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),
    // Rate limiting padrão (§8) — rotas sensíveis endurecem via @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    // Agendador (liberação de reservas expiradas, §6.4)
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    CryptoModule,
    AuthModule,
    HealthModule,
    IdentityModule,
    CatalogModule,
    CartModule,
    ShippingModule,
    CheckoutModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
