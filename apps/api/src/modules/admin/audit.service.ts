import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface AuditEntry {
  actorId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/** Campos que nunca podem entrar no log (§8): PII e dados de cartão. */
const FORBIDDEN_KEYS = [
  'password',
  'senha',
  'cpf',
  'card',
  'cardnumber',
  'cardtoken',
  'cvv',
  'token',
  'secret',
  'authorization',
  'birthdate',
  'phone',
];

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[profundo]';
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitize(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = FORBIDDEN_KEYS.some((f) => k.toLowerCase().includes(f))
        ? '[removido]'
        : sanitize(v, depth + 1);
    }
    return out;
  }
  return value;
}

/**
 * Trilha de auditoria (§6.8): toda ação de staff é registrada em audit_logs.
 * Metadados passam por sanitização — nunca gravamos PII nem dados de cartão (§8).
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          action: entry.action,
          entity: entry.entity ?? null,
          entityId: entry.entityId ?? null,
          metadata: (entry.metadata
            ? sanitize(entry.metadata)
            : undefined) as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      // Auditoria nunca deve derrubar a operação de negócio
      this.logger.error(`Falha ao gravar auditoria (${entry.action}): ${String(err)}`);
    }
  }

  async list(params: { page?: number; action?: string; entity?: string }) {
    const page = params.page ?? 1;
    const pageSize = 50;
    const where: Prisma.AuditLogWhereInput = {};
    if (params.action) where.action = { contains: params.action, mode: 'insensitive' };
    if (params.entity) where.entity = params.entity;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}
