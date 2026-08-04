import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import {
  OrderStatus,
  PAYMENT_TRANSITIONS,
  PaymentMethod,
  PaymentStatus,
} from '@cereja/shared-types';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';
import { CheckoutService } from '../checkout/checkout.service';
import {
  PAYMENT_GATEWAY,
  type GatewayCharge,
  type PaymentGateway,
  type WebhookEvent,
} from './gateway/payment-gateway.port';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly descriptor: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly checkout: CheckoutService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    config: ConfigService,
  ) {
    // Descritor neutro na fatura do cartão (§1.2/§8)
    this.descriptor = config.get<string>('app.discreet.billingDescriptor') ?? 'CLS*COMPRAS';
  }

  /**
   * Inicia a cobrança de um pedido (§6.5). Idempotente por pedido+método:
   * repetir a chamada devolve a mesma cobrança, nunca cria uma segunda.
   */
  async createPayment(orderId: string, dto: CreatePaymentDto, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    // Autorização: dono logado ou convidado que informa o e-mail do pedido
    const isOwner = userId ? order.userId === userId : order.guestEmail === dto.guestEmail;
    if (!isOwner) throw new NotFoundException('Pedido não encontrado');

    if (order.status !== OrderStatus.AwaitingPayment) {
      throw new ConflictException(`Pedido não está aguardando pagamento (${order.status})`);
    }

    const amountCents = Number(order.totalCents);
    const idempotencyKey = createHash('sha256')
      .update(`${orderId}:${dto.method}:${amountCents}`)
      .digest('hex');

    // Já existe cobrança para este pedido+método? Devolve a mesma.
    const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
    if (existing) {
      const cached = await this.redis.client.get(this.chargeKey(existing.id));
      return {
        paymentId: existing.id,
        method: existing.method,
        status: existing.status,
        amountCents: Number(existing.amountCents),
        charge: cached ? (JSON.parse(cached) as GatewayCharge) : null,
        reused: true,
      };
    }

    const email = order.guestEmail ?? (await this.customerEmail(order.userId));
    const req = {
      orderId,
      amountCents,
      statementDescriptor: this.descriptor,
      customer: { email },
      idempotencyKey,
    };

    let charge: GatewayCharge;
    if (dto.method === PaymentMethod.Pix) {
      charge = await this.gateway.createPixCharge(req);
    } else if (dto.method === PaymentMethod.Boleto) {
      charge = await this.gateway.createBoleto(req);
    } else {
      if (!dto.cardToken) throw new BadRequestException('Token de cartão obrigatório');
      charge = await this.gateway.chargeCard({
        ...req,
        cardToken: dto.cardToken,
        installments: dto.installments ?? 1,
      });
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        method: dto.method,
        status: charge.status,
        gatewayToken: charge.gatewayId, // token do gateway, nunca o cartão
        amountCents: BigInt(amountCents),
        installments: dto.method === PaymentMethod.CreditCard ? (dto.installments ?? 1) : 1,
        idempotencyKey,
      },
    });

    // Dados de exibição (QR code/linha digitável) — efêmeros, fora do banco
    await this.redis.client.set(
      this.chargeKey(payment.id),
      JSON.stringify(charge),
      'EX',
      60 * 60 * 24,
    );

    this.logger.log(`Cobrança ${dto.method} criada para pedido ${orderId} (${charge.status})`);

    // Cartão autorizado já confirma o pedido (captura imediata no sandbox)
    if (charge.status === PaymentStatus.Authorized) {
      await this.markPaid(payment.id);
    }

    return {
      paymentId: payment.id,
      method: dto.method,
      status: charge.status === PaymentStatus.Authorized ? PaymentStatus.Paid : charge.status,
      amountCents,
      charge,
      reused: false,
    };
  }

  /**
   * Processa webhook do provedor (§6.5): assinatura verificada + idempotente
   * por eventId. Reentregas do mesmo evento não têm efeito duplicado.
   */
  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const event = this.gateway.parseWebhook(rawBody, signature);
    if (!event) throw new BadRequestException('Webhook inválido');

    // Idempotência: marca o evento como processado; se já existia, ignora.
    const firstTime = await this.redis.client.set(
      this.eventKey(event.eventId),
      '1',
      'EX',
      60 * 60 * 24 * 7,
      'NX',
    );
    if (firstTime === null) {
      this.logger.log(`Webhook ${event.eventId} já processado — ignorado`);
      return { status: 'duplicate' as const };
    }

    const payment = await this.prisma.payment.findFirst({
      where: { gatewayToken: event.gatewayId },
    });
    if (!payment) {
      this.logger.warn(`Webhook para cobrança desconhecida: ${event.gatewayId}`);
      return { status: 'unknown' as const };
    }

    await this.applyStatus(payment.id, event);
    return { status: 'processed' as const };
  }

  private async applyStatus(paymentId: string, event: WebhookEvent) {
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const current = payment.status as PaymentStatus;
    const next = event.status;

    if (current === next) return;
    if (!PAYMENT_TRANSITIONS[current]?.includes(next)) {
      this.logger.warn(`Transição de pagamento ignorada: ${current} → ${next}`);
      return;
    }

    await this.prisma.payment.update({ where: { id: paymentId }, data: { status: next } });

    if (next === PaymentStatus.Paid || next === PaymentStatus.Authorized) {
      await this.markPaid(paymentId);
    }
    if (next === PaymentStatus.Failed) {
      this.logger.log(`Pagamento ${paymentId} falhou`);
    }
    if (next === PaymentStatus.Refunded) {
      await this.safeOrderTransition(payment.orderId, OrderStatus.Refunded);
    }
  }

  /** Confirma o pagamento e leva o pedido para "pago" (baixa o estoque). */
  private async markPaid(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (payment.status !== PaymentStatus.Paid) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.Paid },
      });
    }
    await this.safeOrderTransition(payment.orderId, OrderStatus.Paid);
  }

  private async safeOrderTransition(orderId: string, next: OrderStatus): Promise<void> {
    try {
      await this.checkout.transition(orderId, next);
    } catch (err) {
      // Já estava no estado alvo ou transição inválida — não quebra o webhook.
      this.logger.warn(`Transição de pedido ${orderId} → ${next} ignorada: ${String(err)}`);
    }
  }

  async listForOrder(orderId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((p) => ({
      id: p.id,
      method: p.method,
      status: p.status,
      amountCents: Number(p.amountCents),
      installments: p.installments,
      createdAt: p.createdAt,
    }));
  }

  private async customerEmail(userId: string | null): Promise<string> {
    if (!userId) return 'cliente@cerejaloveshop.local';
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email ?? 'cliente@cerejaloveshop.local';
  }

  private chargeKey(paymentId: string): string {
    return `payment:charge:${paymentId}`;
  }

  private eventKey(eventId: string): string {
    return `payment:event:${eventId}`;
  }
}
