import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CheckoutService } from './checkout.service';

/**
 * Libera reservas de estoque de pedidos não pagos após o prazo (§6.4).
 * Roda a cada 5 minutos. Em escala horizontal, migrar para BullMQ com lock
 * distribuído — a lógica de liberação já está isolada no CheckoutService.
 */
@Injectable()
export class ReservationCleanupJob {
  private readonly logger = new Logger(ReservationCleanupJob.name);

  constructor(private readonly checkout: CheckoutService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handle(): Promise<void> {
    try {
      await this.checkout.releaseExpiredReservations();
    } catch (err) {
      this.logger.error(`Falha na liberação de reservas: ${String(err)}`);
    }
  }
}
