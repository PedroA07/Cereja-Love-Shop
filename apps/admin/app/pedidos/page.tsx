'use client';

import { useState } from 'react';
import { Button, cn } from '@cereja/ui';
import { formatBRL, formatDate } from '@/lib/api';
import { useAction, useApi } from '@/lib/use-api';

interface OrderRow {
  id: string;
  status: string;
  customer: string;
  customerName: string | null;
  itemCount: number;
  totalCents: number;
  payment: { method: string; status: string } | null;
  createdAt: string;
}

interface OrderList {
  items: OrderRow[];
  total: number;
  page: number;
  pages: number;
}

const STATUS_LABEL: Record<string, string> = {
  created: 'Criado',
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pago',
  processing: 'Em separação',
  shipped: 'Enviado',
  delivered: 'Entregue',
  completed: 'Concluído',
  canceled: 'Cancelado',
  refunded: 'Reembolsado',
};

/** Próximos estados possíveis (espelha a máquina de estados do backend, §7). */
const NEXT_STATUS: Record<string, string[]> = {
  awaiting_payment: ['canceled'],
  paid: ['processing', 'refunded'],
  processing: ['shipped', 'canceled'],
  shipped: ['delivered'],
  delivered: ['completed'],
};

const FILTERS = [
  { key: '', label: 'Todos' },
  { key: 'awaiting_payment', label: 'Aguardando' },
  { key: 'paid', label: 'Pagos' },
  { key: 'processing', label: 'Em separação' },
  { key: 'shipped', label: 'Enviados' },
  { key: 'canceled', label: 'Cancelados' },
];

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'paid' || status === 'completed' || status === 'delivered'
      ? 'bg-green-100 text-green-800'
      : status === 'canceled' || status === 'refunded'
        ? 'bg-nude/40 text-ink/60'
        : status === 'awaiting_payment'
          ? 'bg-creme text-vinho'
          : 'bg-creme-200 text-ink';
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', tone)}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function OrdersPage() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const query = status ? `?status=${status}` : '';
  const { data, loading, error, reload } = useApi<OrderList>(`/admin/orders${query}`);
  const action = useAction();

  async function transition(id: string, next: string) {
    setBusy(id);
    try {
      await action(`/admin/orders/${id}/status`, 'POST', { status: next });
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao atualizar');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-vinho">Pedidos</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              'rounded-full px-3 py-1 text-sm',
              status === f.key ? 'bg-vinho text-offwhite' : 'bg-creme text-ink hover:bg-creme-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-ink/50">Carregando…</p>}
      {error && <p className="mt-6 text-cereja">{error}</p>}

      {data && (
        <div className="mt-6 overflow-x-auto rounded-lg bg-offwhite ring-1 ring-nude/20">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-nude/30 text-left text-xs uppercase text-ink/50">
              <tr>
                <th className="p-3">Pedido</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Status</th>
                <th className="p-3">Pagamento</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} className="border-b border-nude/20 last:border-0">
                  <td className="p-3">
                    <span className="font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</span>
                    <span className="block text-xs text-ink/40">{formatDate(o.createdAt)}</span>
                  </td>
                  <td className="p-3">
                    <span className="block">{o.customerName ?? '—'}</span>
                    <span className="text-xs text-ink/50">{o.customer}</span>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="p-3 text-xs text-ink/60">
                    {o.payment ? `${o.payment.method} · ${o.payment.status}` : '—'}
                  </td>
                  <td className="p-3 text-right font-medium">{formatBRL(o.totalCents)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(NEXT_STATUS[o.status] ?? []).map((next) => (
                        <Button
                          key={next}
                          size="sm"
                          variant={next === 'canceled' ? 'outline' : 'primary'}
                          disabled={busy === o.id}
                          onClick={() => void transition(o.id, next)}
                        >
                          {STATUS_LABEL[next]}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink/50">
                    Nenhum pedido por aqui.
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
