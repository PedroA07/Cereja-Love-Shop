import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '../../modules/identity/services/token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';

/**
 * Núcleo de autenticação disponível a todos os módulos: emissão/validação de
 * tokens e os guards de JWT e RBAC (§6.1). Global para que qualquer módulo
 * possa proteger rotas sem reimportar.
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [TokenService, JwtAuthGuard, PermissionsGuard],
  exports: [TokenService, JwtAuthGuard, PermissionsGuard, JwtModule],
})
export class AuthModule {}
