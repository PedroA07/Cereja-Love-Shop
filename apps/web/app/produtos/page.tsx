import type { Metadata } from 'next';
import Link from 'next/link';
import { StoreHeader } from '@/components/store-header';
import { ProductGrid } from '@/components/product-grid';
import { fetchCategories, fetchProducts } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Produtos — Cereja Love Shop' };

const SORTS = [
  { key: 'recent', label: 'Novidades' },
  { key: 'price_asc', label: 'Menor preço' },
  { key: 'price_desc', label: 'Maior preço' },
];

type SearchParams = Promise<{ category?: string; q?: string; sort?: string; page?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = Number(sp.page ?? '1') || 1;

  const [categories, list] = await Promise.all([
    fetchCategories().catch(() => []),
    fetchProducts({ category: sp.category, q: sp.q, sort: sp.sort, page }).catch(() => null),
  ]);

  const buildHref = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { category: sp.category, q: sp.q, sort: sp.sort, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return `/produtos${qs ? `?${qs}` : ''}`;
  };

  return (
    <>
      <StoreHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-serif text-4xl text-vinho">Produtos</h1>

        {/* Busca */}
        <form className="mt-6 flex gap-2" action="/produtos">
          {sp.category && <input type="hidden" name="category" value={sp.category} />}
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Buscar produtos…"
            className="h-11 flex-1 rounded-md border border-nude bg-offwhite px-3 font-sans text-[15px] text-ink placeholder:text-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cereja"
          />
          <button className="h-11 rounded-md bg-cereja px-5 text-sm font-medium text-offwhite hover:bg-vinho">
            Buscar
          </button>
        </form>

        {/* Categorias */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={buildHref({ category: undefined, page: undefined })}
            className={`rounded-full px-3 py-1 text-sm ${!sp.category ? 'bg-vinho text-offwhite' : 'bg-creme text-ink hover:bg-creme-200'}`}
          >
            Todas
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildHref({ category: c.slug, page: undefined })}
              className={`rounded-full px-3 py-1 text-sm ${sp.category === c.slug ? 'bg-vinho text-offwhite' : 'bg-creme text-ink hover:bg-creme-200'}`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Ordenação */}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="text-ink/50">Ordenar:</span>
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={buildHref({ sort: s.key, page: undefined })}
              className={`${(sp.sort ?? 'recent') === s.key ? 'font-semibold text-cereja' : 'text-ink/60 hover:text-cereja'}`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        {/* Resultados */}
        <div className="mt-8">
          {list ? (
            <>
              <ProductGrid products={list.items} />
              {list.pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4 text-sm">
                  {page > 1 && (
                    <Link href={buildHref({ page: String(page - 1) })} className="text-cereja hover:text-vinho">
                      ← Anterior
                    </Link>
                  )}
                  <span className="text-ink/60">
                    Página {list.page} de {list.pages}
                  </span>
                  {page < list.pages && (
                    <Link href={buildHref({ page: String(page + 1) })} className="text-cereja hover:text-vinho">
                      Próxima →
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="rounded-lg bg-creme/40 p-8 text-center text-ink/60">
              Não foi possível carregar os produtos agora. Tente novamente em instantes.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
