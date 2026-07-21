import Link from 'next/link';
import { CherryMark } from '@cereja/ui';

/** Moldura das telas de autenticação, coerente com a identidade da marca. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-creme/40 px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <CherryMark size={30} className="text-cereja" />
          <span className="font-serif text-2xl font-semibold text-vinho">Cereja Love Shop</span>
        </Link>
        <div className="rounded-lg bg-offwhite p-8 shadow-soft ring-1 ring-nude/30">
          <h1 className="font-serif text-2xl text-vinho">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-ink/70">{subtitle}</p>
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-ink/50">
          Ambiente exclusivo para maiores de 18 anos. Sua idade é verificada no servidor.
        </p>
      </div>
    </main>
  );
}
