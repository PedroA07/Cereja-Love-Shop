import type { PrincipalType } from '../../modules/identity/services/token.service';

/** Usuário autenticado anexado ao request pelos guards. */
export interface AuthUser {
  id: string;
  type: PrincipalType;
  email: string;
  permissions: string[];
}

export const AUTH_TYPE_KEY = 'authType';
export const PERMISSIONS_KEY = 'requiredPermissions';
export const IS_PUBLIC_KEY = 'isPublic';
