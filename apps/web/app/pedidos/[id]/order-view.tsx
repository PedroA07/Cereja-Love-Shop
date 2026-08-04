'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatBRL } from '@cereja/shared-types';
import { Button, CherryMark, IconCheck, IconDiscreetPackage } from '@cereja/ui';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/features/auth/auth-context';
import { PaymentPanel } from '@/features/checkout/payment-panel';

interface Order {
  id: string;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: string;
  shipping: { label?: string; etaDays?: number; address?: Record<string, string> } | null;
  items: { id: string; name: string; quantity: number; lineCents: number }[];
  history: { status: string; at: string }[];
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

export function OrderView({ orderId, email }: { orderId: string; email?: string }) {
  const { getAccessToken, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const qs = email ? `?email=${encodeURIComponent(email)}` : '';
    return apiFetch<Order>(`/checkout/orders/${orderId}${qs}`, {
      accessToken: getAccessToken() ?? undefined,
    })
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : 'Pedido não encontrado'));
  }, [orderId, email, getAccessToken]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink/70">{error}</p>
        <Link href="/produtos" className="mt-4 inline-block">
          <Button variant="outline">Voltar à loja</Button>
        </Link>
      </div>
    );
  }

  if (!order) return <p className="py-16 text-center text-ink/50">Carregando pedido…</p>;

  const address = order.shipping?.address;
  const isPaid = ['paid', 'processing', 'shipped', 'delivered', 'completed'].includes(order.status);

  return (
    <div>
      <div className="flex flex-col items-center gap-3 rounded-lg bg-creme/40 p-8 text-center">
        {isPaid ? (
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cereja text-offwhite">
            <IconCheck size={26} />
          </span>
        ) : (
          <CherryMark size={40} className="text-cereja" />
        )}
        <h1 className="font-serif text-3xl text-vinho">
          {isPaid ? 'Pagamento confirmado!' : 'Pedido registrado!'}
        </h1>
        <p className="text-sm text-ink/70">
          Número <span className="font-mono text-ink">{order.id.slice(0, 8).toUpperCase()}</span> ·{' '}
          {STATUS_LABEL[order.status] ?? order.status}
        </p>
        <p className="max-w-md text-sm text-ink/60">
          {order.status === 'awaiting_payment'
            ? 'Escolha abaixo como pagar. Guarde este link para acompanhar seu pedido.'
            : isPaid
              ? 'Seu pedido entrou em separação. A cobrança aparece com descritor neutro na fatura.'
              : 'Guarde este link para acompanhar seu pedido.'}
        </p>
      </div>

      {/* Pagamento — só enquanto o pedido aguarda */}
      {order.status === 'awaiting_payment' && (
        <div className="mt-8">
          <PaymentPanel
            orderId={order.id}
            email={email}
            totalCents={order.totalCents}
            onPaid={() => void load()}
          />
        </div>
      )}

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_300px]">
        <section>
          <h2 className="font-serif text-xl text-vinho">Itens</h2>
          <ul className="mt-3 divide-y divide-nude/30">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between py-3 text-sm">
                <span className="text-ink/80">
                  {i.quantity}× {i.name}
                </span>
                <span className="font-medium text-ink">{formatBRL(i.lineCents)}</span>
              </li>
            ))}
          </ul>

          {address && (
            <>
              <h2 className="mt-8 font-serif text-xl text-vinho">Entrega</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {address.recipientName}
                <br />
                {address.street}, {address.number}
                {address.complement ? ` — ${address.complement}` : ''}
                <br />
                {address.district} · {address.city}/{address.state}
                <br />
                CEP {address.zipCode}
              </p>
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-ink/60">
                <IconDiscreetPackage size={16} />
                {order.shipping?.label} — embalagem neutra e remetente discreto
              </p>
            </>
          )}
        </section>

        <aside className="h-fit rounded-lg bg-creme/40 p-6 text-sm">
          <h2 className="font-serif text-xl text-vinho">Total</h2>
          <div className="mt-3 flex justify-between text-ink/70">
            <span>Subtotal</span>
            <span>{formatBRL(order.subtotalCents)}</span>
          </div>
          <div className="mt-1 flex justify-between text-ink/70">
            <span>Frete</span>
            <span>{order.shippingCents === 0 ? 'Grátis' : formatBRL(order.shippingCents)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-nude/40 pt-3">
            <span className="font-medium text-ink">Total</span>
            <span className="font-semibold text-cereja">{formatBRL(order.totalCents)}</span>
          </div>
          <Link href="/produtos" className="mt-6 block">
            <Button variant="outline" className="w-full">
              Continuar comprando
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
