import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface HealthReport {
  status: 'ok' | 'degraded';
  timestamp: string;
  checks: Record<string, 'up' | 'down'>;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness simples — o processo está de pé. */
  live(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Readiness — verifica dependências críticas (Postgres). */
  async ready(): Promise<HealthReport> {
    const checks: Record<string, 'up' | 'down'> = {};
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'up';
    } catch {
      checks.database = 'down';
    }

    const allUp = Object.values(checks).every((v) => v === 'up');
    return {
      status: allUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
