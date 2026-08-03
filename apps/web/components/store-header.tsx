import Link from 'next/link';
import { CherryMark } from '@cereja/ui';
import { AuthNav } from '@/features/auth/auth-nav';
import { CartNav } from '@/features/cart/cart-nav';

const NAV = [
  { label: 'Lingerie', slug: 'lingerie' },
  { label: 'Cosméticos', slug: 'cosmeticos' },
  { label: 'Bem-estar', slug: 'bem-estar' },
  { label: 'Acessórios', slug: 'acessorios' },
];

export function StoreHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-nude/40 bg-offwhite/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <CherryMark size={26} className="text-cereja" />
          <span className="font-serif text-xl font-semibold text-cereja">Cereja Love Shop</span>
        </Link>
        <nav className="hidden gap-6 text-sm text-ink/80 md:flex">
          <Link href="/produtos" className="hover:text-cereja">
            Todos
          </Link>
          {NAV.map((n) => (
            <Link key={n.slug} href={`/produtos?category=${n.slug}`} className="hover:text-cereja">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <CartNav />
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
