import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthType, CurrentUser } from '../../common/auth/decorators';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import type { AuthUser } from '../../common/auth/auth-user';
import { IdentityService } from './identity.service';
import { ConsentDto } from './dto/consent.dto';
import { clearRefreshCookie } from './cookie.util';

/** Direitos do titular LGPD (§6.1): consentimento, portabilidade e exclusão. */
@Controller('account')
@UseGuards(JwtAuthGuard)
@AuthType('customer')
export class AccountController {
  constructor(private readonly identity: IdentityService) {}

  @Get('consents')
  consents(@CurrentUser() user: AuthUser) {
    return this.identity.listConsents(user.id);
  }

  @Post('consents')
  @HttpCode(HttpStatus.OK)
  updateConsent(@CurrentUser() user: AuthUser, @Body() dto: ConsentDto) {
    return this.identity.recordConsent(user.id, dto.purpose, dto.granted);
  }

  /** Acesso/portabilidade — devolve os dados do titular. */
  @Get('export')
  export(@CurrentUser() user: AuthUser) {
    return this.identity.exportData(user.id);
  }

  /** Exclusão — anonimiza preservando obrigações fiscais (§1.2). */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    await this.identity.deleteAccount(user.id);
    clearRefreshCookie(res);
    return { status: 'anonymized' };
  }
}
