import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AccountController } from './account.controller';
import { StaffAuthController } from './staff-auth.controller';
import { IdentityService } from './identity.service';
import { StaffAuthService } from './staff-auth.service';
import { IdentityRepository } from './identity.repository';
import { PasswordService } from './services/password.service';
import { TotpService } from './services/totp.service';
import { EmailVerificationService } from './services/email-verification.service';

/**
 * Bounded context de identidade (§3): cadastro/auth de clientes, auth de staff
 * com 2FA, RBAC e direitos LGPD. TokenService e guards vêm do AuthModule global.
 */
@Module({
  controllers: [AuthController, StaffAuthController, AccountController],
  providers: [
    IdentityService,
    StaffAuthService,
    IdentityRepository,
    PasswordService,
    TotpService,
    EmailVerificationService,
  ],
  exports: [IdentityRepository],
})
export class IdentityModule {}
