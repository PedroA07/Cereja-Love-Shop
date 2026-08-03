import type { Metadata } from 'next';
import { StoreHeader } from '@/components/store-header';
import { CartPageClient } from './cart-page';

export const metadata: Metadata = { title: 'Carrinho — Cereja Love Shop' };

export default function CartPage() {
  return (
    <>
      <StoreHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-8 font-serif text-4xl text-vinho">Seu carrinho</h1>
        <CartPageClient />
      </main>
    </>
  );
}
