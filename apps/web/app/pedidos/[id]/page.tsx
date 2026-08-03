import type { Metadata } from 'next';
import { StoreHeader } from '@/components/store-header';
import { OrderView } from './order-view';

// Título neutro por discrição (§1.2)
export const metadata: Metadata = { title: 'Seu pedido — Cereja Love Shop' };

type Params = Promise<{ id: string }>;
type Search = Promise<{ email?: string }>;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { id } = await params;
  const { email } = await searchParams;

  return (
    <>
      <StoreHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <OrderView orderId={id} email={email} />
      </main>
    </>
  );
}
