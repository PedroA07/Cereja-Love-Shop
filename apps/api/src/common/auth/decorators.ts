import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { PrincipalType } from '../../modules/identity/services/token.service';
import { AUTH_TYPE_KEY, AuthUser, IS_PUBLIC_KEY, PERMISSIONS_KEY } from './auth-user';

/** Marca a rota como pública (pula o JwtAuthGuard). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Exige que o principal seja de um tipo específico (customer|staff). */
export const AuthType = (type: PrincipalType) => SetMetadata(AUTH_TYPE_KEY, type);

/** RBAC por permissão `recurso:ação` (§6.1). Implica principal staff. */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Injeta o usuário autenticado no handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
