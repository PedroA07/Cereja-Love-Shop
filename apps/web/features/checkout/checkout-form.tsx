'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatBRL } from '@cereja/shared-types';
import { Button, IconDiscreetPackage, Input } from '@cereja/ui';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/features/auth/auth-context';
import { useCart } from '@/features/cart/cart-context';

interface ShippingOption {
  code: string;
  label: string;
  priceCents: number;
  etaDays: number;
}

interface OrderResponse {
  id: string;
  totalCents: number;
}

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

export function CheckoutForm() {
  const { user, getAccessToken } = useAuth();
  const { items, subtotalCents, count, loading: cartLoading, refresh } = useCart();
  const router = useRouter();

  const [uf, setUf] = useState('SP');
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [shippingCode, setShippingCode] = useState('standard');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cotação de frete reage à UF e ao subtotal
  useEffect(() => {
    if (subtotalCents <= 0) return;
    let active = true;
    apiFetch<{ options: ShippingOption[] }>(
      `/shipping/quote?state=${uf}&subtotalCents=${subtotalCents}`,
    )
      .then((res) => {
        if (active) setOptions(res.options);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [uf, subtotalCents]);

  const shipping = options.find((o) => o.code === shippingCode);
  const totalCents = subtotalCents + (shipping?.priceCents ?? 0);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    if (!form.get('acceptedReturnPolicy')) {
      setError('É necessário aceitar a política de devolução.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await apiFetch<OrderResponse>('/checkout/orders', {
        method: 'POST',
        accessToken: getAccessToken() ?? undefined,
        body: {
          ...(user ? {} : { guestEmail: String(form.get('guestEmail')) }),
          shippingCode,
          acceptedReturnPolicy: true,
          address: {
            zipCode: String(form.get('zipCode')),
            street: String(form.get('street')),
            number: String(form.get('number')),
            complement: String(form.get('complement') || '') || undefined,
            district: String(form.get('district')),
            city: String(form.get('city')),
            state: uf,
            recipientName: String(form.get('recipientName')),
          },
        },
      });
      await refresh();
      const email = user ? '' : `?email=${encodeURIComponent(String(form.get('guestEmail')))}`;
      router.push(`/pedidos/${order.id}${email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir o pedido');
    } finally {
      setSubmitting(false);
    }
  }

  if (cartLoading) return <p className="py-16 text-center text-ink/50">Carregando…</p>;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink/70">Seu carrinho está vazio.</p>
        <Link href="/produtos" className="mt-4 inline-block">
          <Button>Ver produtos</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-8">
        {/* Identificação */}
        <section>
          <h2 className="font-serif text-xl text-vinho">1. Identificação</h2>
          {user ? (
            <p className="mt-2 text-sm text-ink/70">
              Comprando como <span className="font-medium text-ink">{user.name}</span> ({user.email})
            </p>
          ) : (
            <div className="mt-3">
              <Input
                name="guestEmail"
                type="email"
                label="Seu e-mail"
                placeholder="para acompanhar o pedido"
                required
              />
              <p className="mt-2 text-xs text-ink/50">
                Você pode comprar sem criar conta.{' '}
                <Link href="/entrar" className="text-cereja hover:text-vinho">
                  Entrar
                </Link>
              </p>
            </div>
          )}
        </section>

        {/* Endereço */}
        <section>
          <h2 className="font-serif text-xl text-vinho">2. Endereço de entrega</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input name="recipientName" label="Quem vai receber" required />
            <Input name="zipCode" label="CEP" placeholder="00000-000" required />
            <Input name="street" label="Rua" className="sm:col-span-1" required />
            <Input name="number" label="Número" required />
            <Input name="complement" label="Complemento (opcional)" />
            <Input name="district" label="Bairro" required />
            <Input name="city" label="Cidade" required />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="state" className="text-sm font-medium text-ink">
                Estado
              </label>
              <select
                id="state"
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="h-11 rounded-md border border-nude bg-offwhite px-3 font-sans text-[15px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cereja"
              >
                {UFS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Frete */}
        <section>
          <h2 className="font-serif text-xl text-vinho">3. Entrega</h2>
          <div className="mt-3 flex flex-col gap-2">
            {options.map((o) => (
              <label
                key={o.code}
                className={`flex cursor-pointer items-center justify-between rounded-md border p-3 ${
                  shippingCode === o.code ? 'border-cereja bg-creme/40' : 'border-nude'
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingCode === o.code}
                    onChange={() => setShippingCode(o.code)}
                    className="accent-cereja"
                  />
                  <span>
                    <span className="block text-sm text-ink">{o.label}</span>
                    <span className="block text-xs text-ink/50">até {o.etaDays} dias úteis</span>
                  </span>
                </span>
                <span className="text-sm font-medium text-ink">
                  {o.priceCents === 0 ? 'Grátis' : formatBRL(o.priceCents)}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-ink/60">
            <IconDiscreetPackage size={16} />
            Embalagem neutra e remetente discreto — nada identifica o conteúdo.
          </p>
        </section>

        {/* Termos */}
        <section>
          <h2 className="font-serif text-xl text-vinho">4. Revisão</h2>
          <label className="mt-3 flex items-start gap-2 text-sm text-ink/80">
            <input type="checkbox" name="acceptedReturnPolicy" className="mt-1 accent-cereja" required />
            <span>
              Li e aceito a política de devolução: direito de arrependimento em 7 dias, exceto
              produtos íntimos abertos, que não são devolvíveis por regra sanitária.
            </span>
          </label>
        </section>
      </div>

      {/* Resumo */}
      <aside className="h-fit rounded-lg bg-creme/40 p-6 lg:sticky lg:top-24">
        <h2 className="font-serif text-xl text-vinho">Resumo</h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {items.map((i) => (
            <li key={i.variantId} className="flex justify-between gap-2 text-ink/70">
              <span className="truncate">
                {i.quantity}× {i.name}
              </span>
              <span className="flex-none">{formatBRL(i.lineCents)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-nude/40 pt-3 text-sm">
          <div className="flex justify-between text-ink/70">
            <span>Subtotal ({count})</span>
            <span>{formatBRL(subtotalCents)}</span>
          </div>
          <div className="mt-1 flex justify-between text-ink/70">
            <span>Frete</span>
            <span>{shipping ? (shipping.priceCents === 0 ? 'Grátis' : formatBRL(shipping.priceCents)) : '—'}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-nude/40 pt-3 text-base">
            <span className="font-medium text-ink">Total</span>
            <span className="font-semibold text-cereja">{formatBRL(totalCents)}</span>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-cereja">{error}</p>}

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
          {submitting ? 'Processando…' : 'Concluir pedido'}
        </Button>
        <p className="mt-3 text-center text-xs text-ink/40">
          Pagamento na próxima etapa. A cobrança aparece com descritor neutro.
        </p>
      </aside>
    </form>
  );
}
