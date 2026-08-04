import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { tap } from 'rxjs';
import type { Observable } from 'rxjs';
import type { AuthUser } from '../auth/auth-user';
import { AuditService } from '../../modules/admin/audit.service';

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Auditoria automática (§6.8): toda ação de ESCRITA feita por staff vira um
 * registro em audit_logs, sem depender de o desenvolvedor lembrar de chamar.
 * Ações de cliente não são auditadas aqui (evita ruído e PII).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();

    return next.handle().pipe(
      tap((result) => {
        const user = req.user;
        if (!user || user.type !== 'staff' || !WRITE_METHODS.has(req.method)) return;

        const entityId =
          (req.params?.id as string | undefined) ??
          (result && typeof result === 'object' && 'id' in result
            ? String((result as { id: unknown }).id)
            : undefined);

        void this.audit.record({
          actorId: user.id,
          action: `${req.method} ${req.route?.path ?? req.path}`,
          entity: this.entityFromPath(req.path),
          entityId,
          metadata: { body: req.body, params: req.params },
        });
      }),
    );
  }

  private entityFromPath(path: string): string | undefined {
    if (path.includes('/products')) return 'product';
    if (path.includes('/variants')) return 'inventory';
    if (path.includes('/categories')) return 'category';
    if (path.includes('/coupons')) return 'coupon';
    if (path.includes('/orders')) return 'order';
    return undefined;
  }
}
