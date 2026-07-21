import type { Metadata } from 'next';
import { AuthShell } from '@/features/auth/auth-shell';
import { RegisterForm } from '@/features/auth/register-form';

export const metadata: Metadata = { title: 'Criar conta — Cereja Love Shop' };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva um minuto. Seus dados são criptografados e nunca compartilhados."
    >
      <RegisterForm />
    </AuthShell>
  );
}
