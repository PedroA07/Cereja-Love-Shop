import type { Metadata } from 'next';
import { AuthShell } from '@/features/auth/auth-shell';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = { title: 'Entrar — Cereja Love Shop' };

export default function LoginPage() {
  return (
    <AuthShell title="Entrar" subtitle="Bem-vinda de volta. Acesse sua conta com discrição.">
      <LoginForm />
    </AuthShell>
  );
}
