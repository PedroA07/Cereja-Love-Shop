'use client';

import { useState } from 'react';
import { Button, cn } from '@cereja/ui';
import { formatBRL, formatDate } from '@/lib/api';
import { useAction, useApi } from '@/lib/use-api';
import { NewCouponForm } from '@/features/coupons/new-coupon-form';

interface CouponRow {
  id: string;
  code: string | null;
  name: string | null;
  discountType: string;
  value: number;
  maxDiscountCents: number | null;
  minOrderCents: number | null;
  usageLimit: number | null;
  usedCount: number;
  remaining: number | null;
  usageLimitPerUser: number;
  validUntil: string | null;
  isActive: boolean;
}

interface CouponList {
  items: CouponRow[];
  total: number;
}

function describe(c: CouponRow): string {
  if (c.discountType === 'percent') {
    const cap = c.maxDiscountCents ? ` (até ${formatBRL(c.maxDiscountCents)})` : '';
    return `${c.value}% de desconto${cap}`;
  }
  if (c.discountType === 'fixed') return `${formatBRL(c.value)} de desconto`;
  return 'Frete grátis';
}

export default function CouponsPage() {
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, loading, error, reload } = useApi<CouponList>('/coupons/admin');
  const action = useAction();

  async function toggle(c: CouponRow) {
    setBusy(c.id);
    try {
      await action(`/coupons/admin/${c.id}/${c.isActive ? 'deactivate' : 'activate'}`, 'POST');
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao atualizar');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-vinho">Cupons</h1>
        <Button onClick={() => setCreating((v) => !v)}>
          {creating ? 'Fechar' : 'Novo cupom'}
        </Button>
      </div>

      {creating && (
        <div className="mt-5">
          <NewCouponForm
            onCreated={() => {
              setCreating(false);
              void reload();
            }}
          />
        </div>
      )}

      {loading && <p className="mt-6 text-ink/50">Carregando…</p>}
      {error && <p className="mt-6 text-cereja">{error}</p>}

      {data && (
        <div className="mt-6 overflow-x-auto rounded-lg bg-offwhite ring-1 ring-nude/20">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-nude/30 text-left text-xs uppercase text-ink/50">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Desconto</th>
                <th className="p-3">Regras</th>
                <th className="p-3 text-right">Usos</th>
                <th className="p-3">Situação</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-b border-nude/20 last:border-0">
                  <td className="p-3">
                    <span className="font-mono font-medium text-cereja">{c.code}</span>
                    {c.name && <span className="block text-xs text-ink/40">{c.name}</span>}
                  </td>
                  <td className="p-3">{describe(c)}</td>
                  <td className="p-3 text-xs text-ink/60">
                    {c.minOrderCents ? <>mín. {formatBRL(c.minOrderCents)}<br /></> : null}
                    {c.usageLimitPerUser}× por cliente
                    {c.validUntil ? <><br />até {formatDate(c.validUntil)}</> : null}
                  </td>
                  <td className="p-3 text-right">
                    {c.usedCount}
                    {c.usageLimit != null && (
                      <span className="text-ink/40">/{c.usageLimit}</span>
                    )}
                    {c.remaining === 0 && (
                      <span className="block text-xs text-cereja">esgotado</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        c.isActive ? 'bg-green-100 text-green-800' : 'bg-nude/40 text-ink/60',
                      )}
                    >
                      {c.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === c.id}
                      onClick={() => void toggle(c)}
                    >
                      {c.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink/50">
                    Nenhum cupom criado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
