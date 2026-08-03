import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from '../../modules/identity/services/token.service';
import type { AuthUser } from './auth-user';

/**
 * Autenticação opcional: se houver Bearer token válido, anexa o usuário; se
 * não, segue como visitante (sem erro). Usado no carrinho (§6.3), que atende
 * cliente logado e convidado.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const token = header.slice(7).trim();
      try {
        const payload = await this.tokens.verifyAccess(token);
        request.user = {
          id: payload.sub,
          type: payload.type,
          email: payload.email,
          permissions: payload.permissions ?? [],
        };
      } catch {
        // token inválido/expirado → segue como visitante
      }
    }
    return true;
  }
}
