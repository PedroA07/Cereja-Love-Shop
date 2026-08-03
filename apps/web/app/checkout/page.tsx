import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@cereja/ui';
import { StoreHeader } from '@/components/store-header';

export const metadata: Metadata = { title: 'Checkout — Cereja Love Shop' };

export default function CheckoutPage() {
  return (
    <>
      <StoreHeader />
      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-serif text-3xl text-vinho">Checkout</h1>
        <p className="mx-auto mt-4 max-w-md text-ink/70">
          A finalização de compra (identificação, endereço, frete e pagamento) está sendo montada —
          é o próximo passo. Seus itens continuam guardados no carrinho.
        </p>
        <div className="mt-8">
          <Link href="/carrinho">
            <Button variant="outline">Voltar ao carrinho</Button>
          </Link>
        </div>
      </main>
    </>
  );
}
