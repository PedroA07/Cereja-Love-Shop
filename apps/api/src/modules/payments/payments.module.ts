import { Module } from '@nestjs/common';
import { CheckoutModule } from '../checkout/checkout.module';
import { PaymentsController, PaymentsWebhookController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PAYMENT_GATEWAY } from './gateway/payment-gateway.port';
import { SandboxGateway } from './gateway/sandbox.gateway';

/**
 * Bounded context de pagamentos (§3/§6.5). O gateway é injetado pela porta
 * PAYMENT_GATEWAY: trocar de provedor = trocar o adaptador aqui, sem tocar
 * no domínio. PAYMENT_PROVIDER=sandbox por enquanto.
 */
@Module({
  imports: [CheckoutModule],
  controllers: [PaymentsController, PaymentsWebhookController],
  providers: [
    PaymentsService,
    SandboxGateway,
    { provide: PAYMENT_GATEWAY, useExisting: SandboxGateway },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
