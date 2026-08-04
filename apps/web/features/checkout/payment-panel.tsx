'use client';

import { useState } from 'react';
import { formatBRL } from '@cereja/shared-types';
import {
  Button,
  IconBarcode,
  IconCard,
  IconCheck,
  IconCopy,
  IconPix,
  Input,
  cn,
} from '@cereja/ui';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/features/auth/auth-context';

type Method = 'pix' | 'boleto' | 'credit_card';

interface ChargeResponse {
  paymentId: string;
  method: Method;
  status: string;
  amountCents: number;
  charge:
    | { method: 'pix'; qrCodePayload: string; expiresAt: string }
    | { method: 'boleto'; digitableLine: string; dueDate: string }
    | { method: 'credit_card'; installments: number; last4?: string }
    | null;
}

const METHODS: { key: Method; label: string; hint: string; icon: typeof IconPix }[] = [
  { key: 'pix', label: 'PIX', hint: 'Aprovação imediata', icon: IconPix },
  { key: 'boleto', label: 'Boleto', hint: 'Vence em 3 dias', icon: IconBarcode },
  { key: 'credit_card', label: 'Cartão', hint: 'Em até 12x', icon: IconCard },
];

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="mt-1 flex gap-2">
        <code className="flex-1 overflow-x-auto rounded-md border border-nude bg-offwhite px-3 py-2 text-xs text-ink">
          {value}
        </code>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-nude px-3 text-sm text-ink hover:bg-creme"
        >
          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

export function PaymentPanel({
  orderId,
  email,
  totalCents,
  onPaid,
}: {
  orderId: string;
  email?: string;
  totalCents: number;
  onPaid: () => void;
}) {
  const { getAccessToken } = useAuth();
  const [method, setMethod] = useState<Method>('pix');
  const [installments, setInstallments] = useState(1);
  const [result, setResult] = useState<ChargeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(cardToken?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ChargeResponse>(`/payments/orders/${orderId}`, {
        method: 'POST',
        accessToken: getAccessToken() ?? undefined,
        body: {
          method,
          ...(email ? { guestEmail: email } : {}),
          ...(method === 'credit_card' ? { cardToken, installments } : {}),
        },
      });
      setResult(res);
      if (res.status === 'paid') onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o pagamento');
    } finally {
      setLoading(false);
    }
  }

  function onCardSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // PCI SAQ-A: em produção, os campos de cartão são hospedados pelo provedor
    // e o browser recebe um token opaco. Aqui simulamos esse token — o número
    // do cartão nunca é enviado ao nosso servidor.
    const form = new FormData(event.currentTarget);
    const last4 = String(form.get('cardNumber') ?? '').replace(/\D/g, '').slice(-4) || '4242';
    void pay(`tok_sandbox_${last4}`);
  }

  // Já pago
  if (result?.status === 'paid') {
    return (
      <div className="rounded-lg bg-creme/50 p-6 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cereja text-offwhite">
          <IconCheck size={26} />
        </span>
        <h3 className="mt-3 font-serif text-2xl text-vinho">Pagamento confirmado</h3>
        <p className="mt-1 text-sm text-ink/70">
          Seu pedido entrou em separação. A cobrança aparece como descritor neutro na fatura.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-nude/50 p-6">
      <h3 className="font-serif text-xl text-vinho">Pagamento</h3>
      <p className="mt-1 text-sm text-ink/60">
        Total a pagar: <span className="font-semibold text-ink">{formatBRL(totalCents)}</span>
      </p>

      {/* Seleção de método */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {METHODS.map(({ key, label, hint, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setMethod(key);
              setResult(null);
            }}
            className={cn(
              'flex flex-col items-center gap-1 rounded-md border p-3 transition-colors',
              method === key ? 'border-cereja bg-creme/40' : 'border-nude hover:bg-creme/30',
            )}
          >
            <Icon size={22} className="text-vinho" />
            <span className="text-sm font-medium text-ink">{label}</span>
            <span className="text-[11px] text-ink/50">{hint}</span>
          </button>
        ))}
      </div>

      {/* PIX */}
      {method === 'pix' && (
        <div className="mt-5">
          {result?.charge?.method === 'pix' ? (
            <>
              <p className="text-sm text-ink/70">
                Abra o app do banco, escolha PIX copia-e-cola e conclua o pagamento.
              </p>
              <CopyField label="Código PIX" value={result.charge.qrCodePayload} />
              <p className="mt-3 text-xs text-ink/50">
                A confirmação é automática assim que o banco avisar.
              </p>
            </>
          ) : (
            <Button onClick={() => void pay()} disabled={loading} size="lg" className="w-full">
              {loading ? 'Gerando…' : 'Gerar código PIX'}
            </Button>
          )}
        </div>
      )}

      {/* Boleto */}
      {method === 'boleto' && (
        <div className="mt-5">
          {result?.charge?.method === 'boleto' ? (
            <>
              <p className="text-sm text-ink/70">
                Pague no app do banco ou lotérica. Vence em {result.charge.dueDate}.
              </p>
              <CopyField label="Linha digitável" value={result.charge.digitableLine} />
            </>
          ) : (
            <Button onClick={() => void pay()} disabled={loading} size="lg" className="w-full">
              {loading ? 'Gerando…' : 'Gerar boleto'}
            </Button>
          )}
        </div>
      )}

      {/* Cartão */}
      {method === 'credit_card' && (
        <form onSubmit={onCardSubmit} className="mt-5 flex flex-col gap-3">
          <Input name="cardNumber" label="Número do cartão" placeholder="0000 0000 0000 0000" inputMode="numeric" required />
          <div className="grid grid-cols-2 gap-3">
            <Input name="expiry" label="Validade" placeholder="MM/AA" required />
            <Input name="cvv" label="CVV" inputMode="numeric" maxLength={4} required />
          </div>
          <Input name="holder" label="Nome impresso no cartão" required />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="installments" className="text-sm font-medium text-ink">
              Parcelas
            </label>
            <select
              id="installments"
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              className="h-11 rounded-md border border-nude bg-offwhite px-3 font-sans text-[15px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cereja"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}x de {formatBRL(Math.round(totalCents / n))}
                  {n === 1 ? ' à vista' : ' sem juros'}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? 'Processando…' : 'Pagar com cartão'}
          </Button>
          <p className="text-center text-[11px] text-ink/50">
            Os dados do cartão são enviados diretamente ao processador de pagamento — nossa loja
            não armazena o número do cartão.
          </p>
        </form>
      )}

      {result?.status === 'failed' && (
        <p className="mt-4 text-sm text-cereja">
          Pagamento não autorizado. Confira os dados ou tente outro método.
        </p>
      )}
      {error && <p className="mt-4 text-sm text-cereja">{error}</p>}
    </div>
  );
}
