'use client';

import Link from 'next/link';
import { formatBRL } from '@/lib/api';
import { useApi } from '@/lib/use-api';

interface Dashboard {
  ordersToday: number;
  awaitingPayment: number;
  revenue30Cents: number;
  paidOrders30: number;
  productsPublished: number;
  productsDraft: number;
  lowStockVariants: number;
}

function Card({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-lg bg-offwhite p-5 shadow-card ring-1 ring-nude/20 transition-shadow hover:shadow-soft">
      <span className="text-sm text-ink/60">{label}</span>
      <p className="mt-1 font-serif text-3xl text-vinho">{value}</p>
      {hint && <span className="text-xs text-ink/40">{hint}</span>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardPage() {
  const { data, loading, error } = useApi<Dashboard>('/admin/dashboard');

  if (loading) return <p className="text-ink/50">Carregando…</p>;
  if (error) return <p className="text-cereja">{error}</p>;
  if (!data) return null;

  return (
    <div>
      <h1 className="font-serif text-3xl text-vinho">Visão geral</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Pedidos hoje" value={String(data.ordersToday)} href="/pedidos" />
        <Card
          label="Aguardando pagamento"
          value={String(data.awaitingPayment)}
          hint="reservas ativas"
          href="/pedidos?status=awaiting_payment"
        />
        <Card
          label="Receita (30 dias)"
          value={formatBRL(data.revenue30Cents)}
          hint={`${data.paidOrders30} pedidos pagos`}
        />
        <Card
          label="Estoque baixo"
          value={String(data.lowStockVariants)}
          hint="variantes com ≤ 5 un."
          href="/produtos"
        />
        <Card label="Produtos publicados" value={String(data.productsPublished)} href="/produtos" />
        <Card
          label="Rascunhos"
          value={String(data.productsDraft)}
          hint="não visíveis na loja"
          href="/produtos?status=draft"
        />
      </div>
    </div>
  );
}
