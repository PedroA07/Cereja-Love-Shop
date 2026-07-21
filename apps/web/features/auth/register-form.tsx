'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@cereja/ui';
import { useAuth } from './auth-context';

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    if (!form.get('acceptedTerms')) {
      setError('É necessário aceitar os termos e a política de privacidade.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: String(form.get('name')),
        email: String(form.get('email')),
        password: String(form.get('password')),
        cpf: String(form.get('cpf')),
        birthDate: String(form.get('birthDate')),
        phone: String(form.get('phone')) || undefined,
        acceptedTerms: true,
        marketingConsent: Boolean(form.get('marketingConsent')),
      });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar conta');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input name="name" label="Nome completo" autoComplete="name" required />
      <Input name="email" type="email" label="E-mail" autoComplete="email" required />
      <div className="grid grid-cols-2 gap-3">
        <Input name="cpf" label="CPF" inputMode="numeric" placeholder="000.000.000-00" required />
        <Input name="birthDate" type="date" label="Data de nascimento" required />
      </div>
      <Input name="phone" label="Telefone (opcional)" autoComplete="tel" placeholder="+55 13 90000-0000" />
      <Input
        name="password"
        type="password"
        label="Senha (mín. 10 caracteres)"
        autoComplete="new-password"
        minLength={10}
        required
      />

      <label className="flex items-start gap-2 text-sm text-ink/80">
        <input type="checkbox" name="acceptedTerms" className="mt-1 accent-cereja" required />
        <span>
          Declaro ter 18 anos ou mais e aceito os termos de uso e a política de privacidade.
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-ink/70">
        <input type="checkbox" name="marketingConsent" className="mt-1 accent-cereja" />
        <span>Quero receber ofertas por e-mail (opcional).</span>
      </label>

      {error && <p className="text-sm text-cereja">{error}</p>}
      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? 'Criando conta…' : 'Criar conta'}
      </Button>
      <p className="text-center text-sm text-ink/70">
        Já tem conta?{' '}
        <Link href="/entrar" className="font-medium text-cereja hover:text-vinho">
          Entrar
        </Link>
      </p>
    </form>
  );
}
