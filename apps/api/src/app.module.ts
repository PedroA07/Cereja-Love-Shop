import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, securityConfig } from './config/app.config';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './infra/prisma/prisma.module';
import { CryptoModule } from './infra/crypto/crypto.module';
import { HealthModule } from './modules/health/health.module';

/**
 * Monólito modular (§3). Os módulos de domínio (identity, catalog, cart,
 * checkout, payments, shipping, coupons, engagement, content, admin) entram
 * nos próximos milestones — cada um com controller → service → repository.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, securityConfig],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),
    PrismaModule,
    CryptoModule,
    HealthModule,
  ],
})
export class AppModule {}
