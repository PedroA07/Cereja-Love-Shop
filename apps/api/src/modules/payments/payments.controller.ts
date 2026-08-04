import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { OptionalJwtAuthGuard } from '../../common/auth/optional-jwt-auth.guard';
import { Public } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/auth/auth-user';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
@UseGuards(OptionalJwtAuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Inicia a cobrança do pedido (PIX, boleto ou cartão tokenizado). */
  @Post('orders/:orderId')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(
    @Req() req: Request,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    const user = (req as Request & { user?: AuthUser }).user;
    return this.payments.createPayment(
      orderId,
      dto,
      user?.type === 'customer' ? user.id : undefined,
    );
  }

  @Get('orders/:orderId')
  list(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.payments.listForOrder(orderId);
  }
}

/**
 * Webhook do provedor (§6.5): rota pública, assinatura verificada e
 * processamento idempotente. Usa o corpo BRUTO (raw) — qualquer reserialização
 * quebraria a assinatura.
 */
@Controller('payments/webhook')
export class PaymentsWebhookController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  handle(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-signature') signature?: string,
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    return this.payments.handleWebhook(raw, signature);
  }
}
