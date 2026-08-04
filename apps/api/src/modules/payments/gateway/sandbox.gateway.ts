import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { PaymentStatus } from '@cereja/shared-types';
import type {
  BoletoCharge,
  CardCharge,
  CardChargeRequest,
  ChargeRequest,
  PaymentGateway,
  PixCharge,
  WebhookEvent,
} from './payment-gateway.port';

/**
 * Adaptador de sandbox (§6.5). Implementa a porta com o mesmo contrato do
 * provedor real: cobranças assíncronas confirmadas por webhook assinado.
 * Permite exercitar o fluxo completo antes da conta do gateway ser aprovada.
 *
 * O adaptador real (Mercado Pago/Pagar.me) substitui apenas esta classe.
 */
@Injectable()
export class SandboxGateway implements PaymentGateway {
  readonly name = 'sandbox';
  private readonly logger = new Logger(SandboxGateway.name);

  private get webhookSecret(): string {
    return process.env.PAYMENT_WEBHOOK_SECRET ?? 'dev_webhook_secret';
  }

  async createPixCharge(req: ChargeRequest): Promise<PixCharge> {
    const gatewayId = `pix_${randomUUID()}`;
    const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
    return {
      method: 'pix',
      gatewayId,
      status: PaymentStatus.Pending,
      qrCodePayload: this.buildBrCode(req.amountCents, gatewayId, req.statementDescriptor),
      expiresAt,
    };
  }

  async createBoleto(req: ChargeRequest): Promise<BoletoCharge> {
    const gatewayId = `bol_${randomUUID()}`;
    const due = new Date(Date.now() + 3 * 24 * 60 * 60_000);
    return {
      method: 'boleto',
      gatewayId,
      status: PaymentStatus.Pending,
      digitableLine: this.buildDigitableLine(req.amountCents),
      barcodeUrl: `sandbox://boleto/${gatewayId}`,
      dueDate: due.toISOString().slice(0, 10),
    };
  }

  async chargeCard(req: CardChargeRequest): Promise<CardCharge> {
    // O token vem do browser (campos hospedados) — o PAN nunca passa por aqui.
    if (!req.cardToken.startsWith('tok_')) {
      throw new Error('Token de cartão inválido');
    }
    // Sandbox: token terminado em "_fail" simula recusa.
    const declined = req.cardToken.endsWith('_fail');
    return {
      method: 'credit_card',
      gatewayId: `card_${randomUUID()}`,
      status: declined ? PaymentStatus.Failed : PaymentStatus.Authorized,
      installments: req.installments,
      last4: req.cardToken.slice(-4).replace(/\D/g, '').padStart(4, '0'),
      brand: 'sandbox',
    };
  }

  async refund(gatewayId: string, amountCents: number): Promise<{ status: PaymentStatus }> {
    this.logger.log(`Reembolso sandbox de ${amountCents} em ${gatewayId}`);
    return { status: PaymentStatus.Refunded };
  }

  /** Assinatura HMAC-SHA256 do corpo bruto (§6.5) — igual aos provedores reais. */
  parseWebhook(rawBody: Buffer, signature: string | undefined): WebhookEvent | null {
    if (!signature) return null;
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.logger.warn('Webhook com assinatura inválida — descartado');
      return null;
    }

    try {
      const payload = JSON.parse(rawBody.toString('utf8')) as {
        eventId?: string;
        gatewayId?: string;
        status?: string;
        amountCents?: number;
      };
      if (!payload.eventId || !payload.gatewayId || !payload.status) return null;
      return {
        eventId: payload.eventId,
        gatewayId: payload.gatewayId,
        status: payload.status as PaymentStatus,
        amountCents: payload.amountCents,
        raw: payload,
      };
    } catch {
      return null;
    }
  }

  /** Assinatura auxiliar para testes/sandbox. */
  sign(body: string): string {
    return createHmac('sha256', this.webhookSecret).update(body).digest('hex');
  }

  // ---- helpers de formato (aparência realista no sandbox) ----

  private buildBrCode(amountCents: number, id: string, merchant: string): string {
    const amount = (amountCents / 100).toFixed(2);
    const short = id.slice(-16).toUpperCase();
    return [
      '00020126',
      `0014BR.GOV.BCB.PIX0132${short}`,
      '52040000',
      '5303986',
      `54${String(amount.length).padStart(2, '0')}${amount}`,
      '5802BR',
      `59${String(merchant.length).padStart(2, '0')}${merchant}`,
      '6009SAO PAULO',
      '62070503***',
      '6304',
    ].join('');
  }

  private buildDigitableLine(amountCents: number): string {
    const value = String(amountCents).padStart(10, '0');
    const rand = () => String(Math.floor(Math.random() * 10 ** 5)).padStart(5, '0');
    return `34191.${rand()} ${rand()}.${rand()} ${rand()}.${rand()} 1 ${value}`;
  }
}
