'use client';

import { useState } from 'react';
import { Button, cn } from '@cereja/ui';
import { formatBRL } from '@/lib/api';
import { useAction, useApi } from '@/lib/use-api';
import { NewProductForm } from '@/features/products/new-product-form';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  brand: string | null;
  variantCount: number;
  stock: number;
  fromPriceCents: number;
}

interface ProductList {
  items: ProductRow[];
  total: number;
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  review: 'Em revisão',
  published: 'Publicado',
  archived: 'Arquivado',
};

/** Transições do workflow de publicação (espelha o backend, §6.2). */
const NEXT_STATUS: Record<string, string[]> = {
  draft: ['review', 'archived'],
  review: ['published', 'draft'],
  published: ['archived'],
  archived: ['draft'],
};

const FILTERS = [
  { key: '', label: 'Todos' },
  { key: 'published', label: 'Publicados' },
  { key: 'draft', label: 'Rascunhos' },
  { key: 'review', label: 'Em revisão' },
];

export default function ProductsPage() {
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const query = status ? `?status=${status}` : '';
  const { data, loading, error, reload } = useApi<ProductList>(`/admin/products${query}`);
  const action = useAction();

  async function changeStatus(id: string, next: string) {
    setBusy(id);
    try {
      await action(`/catalog/admin/products/${id}/status`, 'POST', { status: next });
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao mudar o status');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-vinho">Produtos</h1>
        <Button onClick={() => setCreating((v) => !v)}>
          {creating ? 'Fechar' : 'Novo produto'}
        </Button>
      </div>

      {creating && (
        <div className="mt-5">
          <NewProductForm
            onCreated={() => {
              setCreating(false);
              void reload();
            }}
          />
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              'rounded-full px-3 py-1 text-sm',
              status === f.key ? 'bg-vinho text-offwhite' : 'bg-creme text-ink hover:bg-creme-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-ink/50">Carregando…</p>}
      {error && <p className="mt-6 text-cereja">{error}</p>}

      {data && (
        <div className="mt-6 overflow-x-auto rounded-lg bg-offwhite ring-1 ring-nude/20">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-nude/30 text-left text-xs uppercase text-ink/50">
              <tr>
                <th className="p-3">Produto</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Estoque</th>
                <th className="p-3 text-right">A partir de</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-b border-nude/20 last:border-0">
                  <td className="p-3">
                    <span className="block font-medium text-ink">{p.name}</span>
                    <span className="text-xs text-ink/40">
                      {p.brand ? `${p.brand} · ` : ''}
                      {p.variantCount} {p.variantCount === 1 ? 'variante' : 'variantes'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        p.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-creme text-vinho',
                      )}
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td
                    className={cn(
                      'p-3 text-right',
                      p.stock <= 5 ? 'font-semibold text-cereja' : 'text-ink',
                    )}
                  >
                    {p.stock}
                  </td>
                  <td className="p-3 text-right">{formatBRL(p.fromPriceCents)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(NEXT_STATUS[p.status] ?? []).map((next) => (
                        <Button
                          key={next}
                          size="sm"
                          variant={next === 'published' ? 'primary' : 'outline'}
                          disabled={busy === p.id}
                          onClick={() => void changeStatus(p.id, next)}
                        >
                          {STATUS_LABEL[next]}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink/50">
                    Nenhum produto aqui. Crie o primeiro em &quot;Novo produto&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
