'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, CherryMark, cn } from '@cereja/ui';
import { useStaffAuth } from '@/features/auth/staff-auth-context';
import { StaffLogin } from '@/features/auth/staff-login';

const NAV = [
  { href: '/', label: 'Visão geral', permission: 'report:read' },
  { href: '/pedidos', label: 'Pedidos', permission: 'order:read' },
  { href: '/produtos', label: 'Produtos', permission: 'product:update' },
  { href: '/cupons', label: 'Cupons', permission: 'coupon:manage' },
  { href: '/auditoria', label: 'Auditoria', permission: 'user:manage' },
];

/** Moldura do painel: exige sessão de staff e monta a navegação por permissão. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { staff, loading, logout, can } = useStaffAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink/50">Carregando…</div>
    );
  }

  if (!staff) return <StaffLogin />;

  const allowed = NAV.filter((n) => can(n.permission));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 flex-none border-r border-nude/40 bg-offwhite p-5 sm:block">
        <Link href="/" className="flex items-center gap-2">
          <CherryMark size={22} className="text-cereja" />
          <span className="font-serif text-lg font-semibold text-vinho">Cereja</span>
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {allowed.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm transition-colors',
                  active ? 'bg-cereja text-offwhite' : 'text-ink/80 hover:bg-creme',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-nude/40 bg-offwhite px-6 py-3">
          <nav className="flex gap-3 overflow-x-auto text-sm sm:hidden">
            {allowed.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap text-ink/70">
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="hidden text-sm text-ink/60 sm:block">{staff.name}</span>
          <Button variant="outline" size="sm" onClick={() => void logout()}>
            Sair
          </Button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
