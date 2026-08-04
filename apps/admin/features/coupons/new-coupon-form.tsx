'use client';

import { useState } from 'react';
import { Button, Input } from '@cereja/ui';
import { useAction } from '@/lib/use-api';

type DiscountType = 'percent' | 'fixed' | 'free_shipping';

function toCents(input: string): number {
  const normalized = input.replace(/\./g, '').replace(',', '.');
  return Math.round(Number(normalized) * 100);
}

export function NewCouponForm({ onCreated }: { onCreated: () => void }) {
  const action = useAction();
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    const rawValue = String(form.get('value') || '0');
    const value = discountType === 'percent' ? Number(rawValue) : toCents(rawValue);

    if (discountType !== 'free_shipping' && (!Number.isFinite(value) || value <= 0)) {
      setError('Informe um valor válido.');
      return;
    }
    if (discountType === 'percent' && value > 100) {
      setError('O percentual não pode passar de 100.');
      return;
    }

    const maxDiscount = String(form.get('maxDiscount') || '');
    const minOrder = String(form.get('minOrder') || '');
    const usageLimit = String(form.get('usageLimit') || '');
    const validUntil = String(form.get('validUntil') || '');

    setSaving(true);
    try {
      await action('/coupons/admin', 'POST', {
        code: String(form.get('code')).trim().toUpperCase(),
        name: String(form.get('name') || '') || undefined,
        discountType,
        value: discountType === 'free_shipping' ? 0 : value,
        ...(discountType === 'percent' && maxDiscount
          ? { maxDiscountCents: toCents(maxDiscount) }
          : {}),
        ...(minOrder ? { minOrderCents: toCents(minOrder) } : {}),
        ...(usageLimit ? { usageLimit: Number(usageLimit) } : {}),
        usageLimitPerUser: Number(form.get('perUser') || 1),
        firstPurchaseOnly: Boolean(form.get('firstPurchaseOnly')),
        ...(validUntil ? { validUntil: new Date(`${validUntil}T23:59:59`).toISOString() } : {}),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o cupom');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-lg bg-offwhite p-6 ring-1 ring-nude/30"
    >
      <h2 className="font-serif text-xl text-vinho">Novo cupom</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="code" label="Código" placeholder="CEREJA15" required className="uppercase" />
        <Input name="name" label="Nome interno (opcional)" placeholder="Campanha de boas-vindas" />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Tipo de desconto</span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['percent', 'Percentual'],
              ['fixed', 'Valor fixo'],
              ['free_shipping', 'Frete grátis'],
            ] as [DiscountType, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDiscountType(key)}
              className={`rounded-full px-3 py-1 text-sm ${
                discountType === key ? 'bg-vinho text-offwhite' : 'bg-creme text-ink hover:bg-creme-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {discountType !== 'free_shipping' && (
          <Input
            name="value"
            label={discountType === 'percent' ? 'Percentual (ex.: 15)' : 'Valor (ex.: 20,00)'}
            required
          />
        )}
        {discountType === 'percent' && (
          <Input name="maxDiscount" label="Teto do desconto (opcional, ex.: 50,00)" />
        )}
        <Input name="minOrder" label="Pedido mínimo (opcional, ex.: 150,00)" />
        <Input name="usageLimit" label="Limite total de usos (opcional)" inputMode="numeric" />
        <Input name="perUser" label="Usos por cliente" defaultValue="1" inputMode="numeric" />
        <Input name="validUntil" type="date" label="Válido até (opcional)" />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input type="checkbox" name="firstPurchaseOnly" className="accent-cereja" />
        Válido apenas na primeira compra
      </label>

      {error && <p className="text-sm text-cereja">{error}</p>}

      <div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Criando…' : 'Criar cupom'}
        </Button>
      </div>
    </form>
  );
}
