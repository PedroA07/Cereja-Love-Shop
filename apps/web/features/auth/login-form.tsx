'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@cereja/ui';
import { ApiError } from '@/lib/api';
import { useAuth } from './auth-context';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [needsTotp, setNeedsTotp] = useState(false);
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
        needsTotp ? String(form.get('totp')) : undefined,
      );
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError && (err.body as { needsTotp?: boolean })?.needsTotp) {
        setNeedsTotp(true);
        setError('Informe o código de verificação em duas etapas.');
      } else {
        setError(err instanceof Error ? err.message : 'Falha ao entrar');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input name="email" type="email" label="E-mail" autoComplete="email" required />
      <Input
        name="password"
        type="password"
        label="Senha"
        autoComplete="current-password"
        required
      />
      {needsTotp && (
        <Input name="totp" label="Código 2FA" inputMode="numeric" maxLength={6} required />
      )}
      {error && <p className="text-sm text-cereja">{error}</p>}
      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? 'Entrando…' : 'Entrar'}
      </Button>
      <p className="text-center text-sm text-ink/70">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-medium text-cereja hover:text-vinho">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
