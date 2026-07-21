import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthType, CurrentUser, Public } from '../../common/auth/decorators';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import type { AuthUser } from '../../common/auth/auth-user';
import { IdentityService } from './identity.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginDto } from './dto/login.dto';
import { ConfirmTotpDto, VerifyEmailDto } from './dto/consent.dto';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from './cookie.util';

@Controller('auth')
@UseGuards(JwtAuthGuard)
@AuthType('customer')
export class AuthController {
  constructor(private readonly identity: IdentityService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterCustomerDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.identity.register(dto);
    setRefreshCookie(res, result.tokens.refreshToken);
    return {
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
      ...('devVerificationToken' in result
        ? { devVerificationToken: result.devVerificationToken }
        : {}),
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.identity.login(dto);
    setRefreshCookie(res, tokens.refreshToken);
    return { user, accessToken: tokens.accessToken, expiresIn: tokens.expiresIn };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const presented = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!presented) throw new UnauthorizedException('Sessão ausente');
    const { accessToken, refreshToken, expiresIn } = await this.identity.refresh(presented);
    setRefreshCookie(res, refreshToken);
    return { accessToken, expiresIn };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.identity.logout(req.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(res);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.identity.verifyEmail(dto.token);
    return { status: 'verified' };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.identity.me(user.id);
  }

  @Post('2fa/setup')
  begin2fa(@CurrentUser() user: AuthUser) {
    return this.identity.beginTwoFactor(user.id, user.email);
  }

  @Post('2fa/confirm')
  @HttpCode(HttpStatus.OK)
  async confirm2fa(@CurrentUser() user: AuthUser, @Body() dto: ConfirmTotpDto) {
    await this.identity.confirmTwoFactor(user.id, dto.code);
    return { twoFactorEnabled: true };
  }

  @Delete('2fa')
  @HttpCode(HttpStatus.OK)
  async disable2fa(@CurrentUser() user: AuthUser) {
    await this.identity.disableTwoFactor(user.id);
    return { twoFactorEnabled: false };
  }
}
