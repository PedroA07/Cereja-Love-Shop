import { Injectable } from '@nestjs/common';

export interface ShippingQuote {
  code: string;
  label: string;
  priceCents: number;
  etaDays: number;
  /** Comunicado de discrição ao cliente (§6.6). */
  discreetPackaging: true;
}

/** Faixa de frete grátis (§6.6). */
const FREE_SHIPPING_THRESHOLD_CENTS = 19900;

const REGION_BY_UF_PREFIX: Record<string, { label: string; base: number; eta: number }> = {
  SP: { label: 'Sudeste', base: 1990, eta: 4 },
  RJ: { label: 'Sudeste', base: 2190, eta: 5 },
  MG: { label: 'Sudeste', base: 2190, eta: 5 },
  ES: { label: 'Sudeste', base: 2290, eta: 6 },
  PR: { label: 'Sul', base: 2390, eta: 6 },
  SC: { label: 'Sul', base: 2390, eta: 6 },
  RS: { label: 'Sul', base: 2590, eta: 7 },
};

const DEFAULT_REGION = { label: 'Demais regiões', base: 3290, eta: 9 };

/**
 * Cálculo de frete (§6.6). Implementação por regras — a integração com
 * transportadora (Correios/API) entra como adaptador nesta mesma interface.
 * Embalagem e remetente discretos são sempre comunicados ao cliente (§1.2).
 */
@Injectable()
export class ShippingService {
  quote(params: { state?: string | null; subtotalCents: number }): ShippingQuote[] {
    const uf = (params.state ?? '').toUpperCase();
    const region = REGION_BY_UF_PREFIX[uf] ?? DEFAULT_REGION;
    const free = params.subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;

    const standard: ShippingQuote = {
      code: 'standard',
      label: `Entrega padrão (${region.label})`,
      priceCents: free ? 0 : region.base,
      etaDays: region.eta,
      discreetPackaging: true,
    };
    const express: ShippingQuote = {
      code: 'express',
      label: `Entrega expressa (${region.label})`,
      priceCents: Math.round(region.base * 1.8),
      etaDays: Math.max(2, region.eta - 3),
      discreetPackaging: true,
    };
    return [standard, express];
  }

  /** Valor de um método específico (usado no fechamento do pedido). */
  priceFor(code: string, params: { state?: string | null; subtotalCents: number }): ShippingQuote | null {
    return this.quote(params).find((q) => q.code === code) ?? null;
  }

  get freeShippingThresholdCents(): number {
    return FREE_SHIPPING_THRESHOLD_CENTS;
  }
}
