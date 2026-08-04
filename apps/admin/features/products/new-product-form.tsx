'use client';

import { useState } from 'react';
import { Button, IconTrash, Input } from '@cereja/ui';
import { useAction, useApi } from '@/lib/use-api';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface VariantDraft {
  sku: string;
  price: string;
  option: string;
  stock: string;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Converte "129,90" ou "129.90" em centavos. */
function toCents(input: string): number {
  const normalized = input.replace(/\./g, '').replace(',', '.');
  return Math.round(Number(normalized) * 100);
}

export function NewProductForm({ onCreated }: { onCreated: () => void }) {
  const action = useAction();
  const { data: categories } = useApi<Category[]>('/catalog/categories');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>([
    { sku: '', price: '', option: '', stock: '0' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((list) => list.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    const payloadVariants = variants
      .filter((v) => v.sku.trim() && v.price.trim())
      .map((v) => ({
        sku: v.sku.trim().toUpperCase(),
        priceCents: toCents(v.price),
        initialStock: Number(v.stock || 0),
        ...(v.option.trim() ? { options: { variacao: v.option.trim() } } : {}),
      }));

    if (payloadVariants.length === 0) {
      setError('Informe ao menos uma variante com SKU e preço.');
      return;
    }
    if (payloadVariants.some((v) => !Number.isFinite(v.priceCents) || v.priceCents <= 0)) {
      setError('Preço inválido. Use o formato 129,90.');
      return;
    }

    setSaving(true);
    try {
      await action('/catalog/admin/products', 'POST', {
        name: name.trim(),
        slug: (slugTouched ? slug : slugify(name)).trim(),
        description: String(form.get('description') || '') || undefined,
        brand: String(form.get('brand') || '') || undefined,
        categorySlug: String(form.get('categorySlug') || '') || undefined,
        variants: payloadVariants,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o produto');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-lg bg-offwhite p-6 ring-1 ring-nude/30"
    >
      <h2 className="font-serif text-xl text-vinho">Novo produto</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          name="name"
          label="Nome"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
        />
        <Input
          name="slug"
          label="Endereço na loja (slug)"
          value={slugTouched ? slug : slugify(name)}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          required
        />
        <Input name="brand" label="Marca (opcional)" />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="categorySlug" className="text-sm font-medium text-ink">
            Categoria
          </label>
          <select
            id="categorySlug"
            name="categorySlug"
            className="h-11 rounded-md border border-nude bg-offwhite px-3 font-sans text-[15px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cereja"
          >
            <option value="">Sem categoria</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-ink">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="rounded-md border border-nude bg-offwhite p-3 font-sans text-[15px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cereja"
        />
      </div>

      {/* Variantes */}
      <div>
        <span className="text-sm font-medium text-ink">Variantes (tamanho, cor, volume…)</span>
        <div className="mt-2 flex flex-col gap-2">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_80px_40px]">
              <input
                placeholder="SKU"
                value={v.sku}
                onChange={(e) => updateVariant(i, { sku: e.target.value })}
                className="h-10 rounded-md border border-nude bg-offwhite px-3 font-sans text-sm uppercase"
              />
              <input
                placeholder="Variação (ex.: P)"
                value={v.option}
                onChange={(e) => updateVariant(i, { option: e.target.value })}
                className="h-10 rounded-md border border-nude bg-offwhite px-3 font-sans text-sm"
              />
              <input
                placeholder="Preço (129,90)"
                value={v.price}
                onChange={(e) => updateVariant(i, { price: e.target.value })}
                className="h-10 rounded-md border border-nude bg-offwhite px-3 font-sans text-sm"
              />
              <input
                placeholder="Estoque"
                inputMode="numeric"
                value={v.stock}
                onChange={(e) => updateVariant(i, { stock: e.target.value })}
                className="h-10 rounded-md border border-nude bg-offwhite px-3 font-sans text-sm"
              />
              {variants.length > 1 && (
                <button
                  type="button"
                  aria-label="Remover variante"
                  onClick={() => setVariants((list) => list.filter((_, idx) => idx !== i))}
                  className="flex h-10 items-center justify-center text-ink/40 hover:text-cereja"
                >
                  <IconTrash size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setVariants((list) => [...list, { sku: '', price: '', option: '', stock: '0' }])}
          className="mt-2 text-sm text-cereja hover:text-vinho"
        >
          + Adicionar variante
        </button>
      </div>

      {error && <p className="text-sm text-cereja">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando…' : 'Criar produto'}
        </Button>
        <span className="text-xs text-ink/50">
          O produto nasce como rascunho — publique quando estiver pronto.
        </span>
      </div>
    </form>
  );
}
