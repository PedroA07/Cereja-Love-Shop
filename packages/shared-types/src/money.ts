/**
 * Dinheiro SEMPRE em centavos, inteiro (§10). `Cents` é um brand para evitar
 * misturar centavos com reais acidentalmente.
 */
export type Cents = number & { readonly __brand: 'Cents' };

export function toCents(value: number): Cents {
  return Math.round(value) as Cents;
}

export function reaisToCents(reais: number): Cents {
  return Math.round(reais * 100) as Cents;
}

/** Formata centavos como moeda brasileira (ex.: 12990 → "R$ 129,90"). */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}
