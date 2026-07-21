'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, CherryMark, IconQuickExit } from '@cereja/ui';

const AGE_GATE_COOKIE = 'clv_age_ack';
const AGE_GATE_TTL_HOURS = 24;

/**
 * Age gate de entrada (§6.1): cookie curto, apenas primeira camada da
 * verificação 18+. A validação real de maioridade é SEMPRE no servidor
 * (birth_date no cadastro/checkout — M1).
 *
 * "Saída rápida" é requisito de discrição (§1.2): substitui a aba por um
 * site neutro e limpa o histórico imediato.
 */
export function AgeGate({ children }: { children: React.ReactNode }) {
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);

  useEffect(() => {
    setAcknowledged(document.cookie.includes(`${AGE_GATE_COOKIE}=1`));
  }, []);

  const confirm = useCallback(() => {
    const maxAge = AGE_GATE_TTL_HOURS * 3600;
    document.cookie = `${AGE_GATE_COOKIE}=1; max-age=${maxAge}; path=/; SameSite=Strict`;
    setAcknowledged(true);
  }, []);

  const quickExit = useCallback(() => {
    window.location.replace('https://www.google.com');
  }, []);

  // Evita flash de conteúdo antes de ler o cookie
  if (acknowledged === null) return null;

  if (!acknowledged) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-vinho/95 px-4">
        <div className="w-full max-w-md rounded-lg bg-offwhite p-8 text-center shadow-soft">
          <p className="flex items-center justify-center gap-2 font-serif text-3xl text-vinho">
            <CherryMark size={30} className="text-cereja" />
            Cereja Love Shop
          </p>
          <h1 className="mt-6 font-serif text-2xl">Conteúdo para maiores de 18 anos</h1>
          <p className="mt-3 text-sm text-ink/70">
            Este site vende produtos íntimos destinados exclusivamente a adultos. Ao continuar,
            você declara ter 18 anos ou mais.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Button onClick={confirm} size="lg">
              Tenho 18 anos ou mais
            </Button>
            <Button onClick={quickExit} variant="ghost" size="sm">
              Sair
            </Button>
          </div>
          <p className="mt-6 text-xs text-ink/50">
            Sua idade será confirmada novamente no cadastro e no checkout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <button
        onClick={quickExit}
        aria-label="Saída rápida"
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-4 py-2 text-xs font-medium text-offwhite shadow-soft transition-colors hover:bg-ink"
      >
        <IconQuickExit size={16} />
        Saída rápida
      </button>
    </>
  );
}
