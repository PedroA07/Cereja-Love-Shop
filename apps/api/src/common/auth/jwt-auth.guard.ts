import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { PrincipalType } from '../../modules/identity/services/token.service';
import { TokenService } from '../../modules/identity/services/token.service';
import { AUTH_TYPE_KEY, AuthUser, IS_PUBLIC_KEY } from './auth-user';

/**
 * Autentica via Bearer access token e anexa o usuário ao request. Respeita
 * @Public() e, se presente, @AuthType() para restringir o tipo de principal.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const request = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractBearer(request);
    if (!token) throw new UnauthorizedException('Credenciais ausentes');

    const payload = await this.tokens.verifyAccess(token);

    const requiredType = this.reflector.getAllAndOverride<PrincipalType>(AUTH_TYPE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (requiredType && payload.type !== requiredType) {
      throw new ForbiddenException('Tipo de conta não autorizado para esta rota');
    }

    const user: AuthUser = {
      id: payload.sub,
      type: payload.type,
      email: payload.email,
      permissions: payload.permissions ?? [],
    };
    (request as Request & { user: AuthUser }).user = user;
    return true;
  }

  private extractBearer(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    return header.slice(7).trim() || null;
  }
}
