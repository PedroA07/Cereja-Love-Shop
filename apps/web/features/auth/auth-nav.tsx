'use client';

import Link from 'next/link';
import { Button } from '@cereja/ui';
import { useAuth } from './auth-context';

/** Estado de conta no cabeçalho: sessão ativa ou atalhos de entrar/cadastrar. */
export function AuthNav() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <span className="h-9 w-24 animate-pulse rounded-md bg-creme" aria-hidden />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden text-ink/80 sm:inline">Olá, {user.name.split(' ')[0]}</span>
        <Button variant="outline" size="sm" onClick={() => void logout()}>
          Sair
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/entrar">
        <Button variant="ghost" size="sm">
          Entrar
        </Button>
      </Link>
      <Link href="/cadastro">
        <Button size="sm">Criar conta</Button>
      </Link>
    </div>
  );
}
