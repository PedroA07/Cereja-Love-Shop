import { Global, Module } from '@nestjs/common';
import { CheckoutModule } from '../checkout/checkout.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';
import { AuditInterceptor } from '../../common/audit/audit.interceptor';

/**
 * Back-office (§3/§6.8): painel isolado, RBAC por permissão e auditoria de
 * todas as ações de staff. AuditService é global para os demais módulos.
 */
@Global()
@Module({
  imports: [CheckoutModule],
  controllers: [AdminController],
  providers: [AdminService, AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AdminModule {}
