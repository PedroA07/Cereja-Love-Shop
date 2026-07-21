import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthUser, PERMISSIONS_KEY } from './auth-user';

/**
 * RBAC baseado em permissões (§6.1). Deve rodar após o JwtAuthGuard.
 * Exige principal staff com TODAS as permissões declaradas na rota.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = request.user;
    if (!user || user.type !== 'staff') {
      throw new ForbiddenException('Acesso restrito a operadores internos');
    }

    const granted = new Set(user.permissions);
    const missing = required.filter((perm) => !granted.has(perm));
    if (missing.length > 0) {
      throw new ForbiddenException(`Permissão insuficiente: ${missing.join(', ')}`);
    }
    return true;
  }
}
