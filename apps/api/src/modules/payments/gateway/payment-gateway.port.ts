import type { PaymentMethod, PaymentStatus } from '@cereja/shared-types';

/**
 * Porta do gateway de pagamento (§2/§6.5). Trocar de provedor (Mercado Pago,
 * Pagar.me…) = escrever outro adaptador desta interface, sem tocar no domínio.
 *
 * PCI SAQ-A: dados de cartão NUNCA chegam aqui — o front tokeniza direto no
 * provedor (campos hospedados) e o backend recebe apenas o token opaco.
 */
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface ChargeRequest {
  orderId: string;
  amountCents: number;
  /** Descritor neutro na fatura (§1.2/§8). */
  statementDescriptor: string;
  customer: { email: string; name?: string };
  /** Chave de idempotência: a mesma requisição nunca cobra duas vezes. */
  idempotencyKey: string;
}

export interface PixCharge {
  method: 'pix';
  gatewayId: string;
  status: PaymentStatus;
  /** Payload copia-e-cola do PIX (BR Code). */
  qrCodePayload: string;
  expiresAt: string;
}

export interface BoletoCharge {
  method: 'boleto';
  gatewayId: string;
  status: PaymentStatus;
  /** Linha digitável. */
  digitableLine: string;
  barcodeUrl: string;
  dueDate: string;
}

export interface CardCharge {
  method: 'credit_card';
  gatewayId: string;
  status: PaymentStatus;
  installments: number;
  /** Últimos 4 dígitos, devolvidos pelo provedor (nunca o número completo). */
  last4?: string;
  brand?: string;
}

export type GatewayCharge = PixCharge | BoletoCharge | CardCharge;

export interface CardChargeRequest extends ChargeRequest {
  /** Token opaco gerado no browser pelo provedor — nunca o PAN. */
  cardToken: string;
  installments: number;
}

/** Evento normalizado vindo do webhook do provedor. */
export interface WebhookEvent {
  /** Id do evento no provedor — usado para idempotência. */
  eventId: string;
  gatewayId: string;
  status: PaymentStatus;
  amountCents?: number;
  raw: unknown;
}

export interface PaymentGateway {
  readonly name: string;

  createPixCharge(req: ChargeRequest): Promise<PixCharge>;
  createBoleto(req: ChargeRequest): Promise<BoletoCharge>;
  chargeCard(req: CardChargeRequest): Promise<CardCharge>;
  refund(gatewayId: string, amountCents: number): Promise<{ status: PaymentStatus }>;

  /**
   * Verifica a assinatura do webhook e normaliza o evento (§6.5).
   * Retorna null se a assinatura for inválida.
   */
  parseWebhook(rawBody: Buffer, signature: string | undefined): WebhookEvent | null;
}

export type { PaymentMethod, PaymentStatus };
