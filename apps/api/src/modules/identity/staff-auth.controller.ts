import {
  Body,
  Controller,
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
import { StaffAuthService } from './staff-auth.service';
import { StaffLoginDto } from './dto/staff-login.dto';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from './cookie.util';

@Controller('staff/auth')
@UseGuards(JwtAuthGuard)
@AuthType('staff')
export class StaffAuthController {
  constructor(private readonly staffAuth: StaffAuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: StaffLoginDto, @Res({ passthrough: true }) res: Response) {
    const { staff, tokens } = await this.staffAuth.login(dto);
    setRefreshCookie(res, tokens.refreshToken);
    return { staff, accessToken: tokens.accessToken, expiresIn: tokens.expiresIn };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const presented = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!presented) throw new UnauthorizedException('Sessão ausente');
    const { accessToken, refreshToken, expiresIn } = await this.staffAuth.refresh(presented);
    setRefreshCookie(res, refreshToken);
    return { accessToken, expiresIn };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.staffAuth.logout(req.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(res);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.staffAuth.me(user.id);
  }
}
