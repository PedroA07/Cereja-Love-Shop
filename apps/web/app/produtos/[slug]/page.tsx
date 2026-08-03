import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { StoreHeader } from '@/components/store-header';
import { ProductView } from '@/components/product-view';
import { fetchProductBySlug } from '@/lib/catalog';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug).catch(() => null);
  // Título neutro por discrição (§1.2)
  return { title: product ? `${product.name} — Cereja Love Shop` : 'Produto — Cereja Love Shop' };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  return (
    <>
      <StoreHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <nav className="mb-6 text-sm text-ink/50">
          <Link href="/produtos" className="hover:text-cereja">
            Produtos
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink/70">{product.name}</span>
        </nav>
        <ProductView product={product} />
      </main>
    </>
  );
}
