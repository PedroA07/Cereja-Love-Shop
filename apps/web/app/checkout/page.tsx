import type { Metadata } from 'next';
import { StoreHeader } from '@/components/store-header';
import { CheckoutForm } from '@/features/checkout/checkout-form';

export const metadata: Metadata = { title: 'Checkout — Cereja Love Shop' };

export default function CheckoutPage() {
  return (
    <>
      <StoreHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-8 font-serif text-4xl text-vinho">Finalizar compra</h1>
        <CheckoutForm />
      </main>
    </>
  );
}
