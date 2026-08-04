'use client';

import { useState } from 'react';
import { Button, CherryMark, Input } from '@cereja/ui';
import { useStaffAuth } from './staff-auth-context';

/** Login de staff — 2FA obrigatório (§6.8). */
export function StaffLogin() {
  const { login } = useStaffAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await login(
        String(form.get('email')),
        String(form.get('password')),
        String(form.get('totp')),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <CherryMark size={28} className="text-cereja" />
          <span className="font-serif text-xl font-semibold text-vinho">Cereja — Back-office</span>
        </div>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-lg bg-offwhite p-8 shadow-soft ring-1 ring-nude/30"
        >
          <div>
            <h1 className="font-serif text-2xl text-vinho">Acesso interno</h1>
            <p className="mt-1 text-sm text-ink/60">Autenticação em duas etapas obrigatória.</p>
          </div>
          <Input name="email" type="email" label="E-mail" autoComplete="username" required />
          <Input
            name="password"
            type="password"
            label="Senha"
            autoComplete="current-password"
            required
          />
          <Input
            name="totp"
            label="Código 2FA"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            required
          />
          {error && <p className="text-sm text-cereja">{error}</p>}
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-ink/40">
          Acesso restrito. Todas as ações são registradas.
        </p>
      </div>
    </main>
  );
}
