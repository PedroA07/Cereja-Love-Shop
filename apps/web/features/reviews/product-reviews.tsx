'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, IconStar, cn } from '@cereja/ui';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/features/auth/auth-context';

interface ReviewsData {
  average: number | null;
  count: number;
  items: { id: string; rating: number; comment: string | null; author: string; createdAt: string }[];
}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-cereja" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <IconStar key={n} size={size} filled={n <= value} />
      ))}
    </span>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const { user, getAccessToken } = useAuth();
  const [data, setData] = useState<ReviewsData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch<ReviewsData>(`/engagement/products/${productId}/reviews`)
      .then(setData)
      .catch(() => setData({ average: null, count: 0, items: [] }));
  }, [productId]);

  useEffect(() => load(), [load]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch('/engagement/reviews', {
        method: 'POST',
        accessToken: getAccessToken() ?? undefined,
        body: { productId, rating, comment: String(form.get('comment') || '') || undefined },
      });
      setSent(true);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-12 border-t border-nude/40 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl text-vinho">Avaliações</h2>
        {user && !sent && (
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancelar' : 'Avaliar produto'}
          </Button>
        )}
      </div>

      {data && data.count > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <Stars value={Math.round(data.average ?? 0)} size={18} />
          <span className="text-sm text-ink/70">
            {data.average?.toFixed(1)} · {data.count} {data.count === 1 ? 'avaliação' : 'avaliações'}
          </span>
        </div>
      )}

      {sent && (
        <p className="mt-4 rounded-md bg-creme/50 p-4 text-sm text-ink/80">
          Obrigado! Sua avaliação foi enviada e aparecerá após revisão da nossa equipe.
        </p>
      )}

      {showForm && (
        <form onSubmit={submit} className="mt-4 rounded-lg bg-creme/30 p-5">
          <span className="text-sm font-medium text-ink">Sua nota</span>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
                className={cn('transition-colors', n <= rating ? 'text-cereja' : 'text-nude')}
              >
                <IconStar size={26} filled={n <= rating} />
              </button>
            ))}
          </div>
          <textarea
            name="comment"
            rows={3}
            placeholder="Conte como foi sua experiência (opcional)"
            className="mt-3 w-full rounded-md border border-nude bg-offwhite p-3 font-sans text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cereja"
          />
          {error && <p className="mt-2 text-sm text-cereja">{error}</p>}
          <div className="mt-3 flex items-center gap-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Enviando…' : 'Enviar avaliação'}
            </Button>
            <span className="text-xs text-ink/50">
              Avaliações passam por moderação antes de aparecer.
            </span>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {data?.items.map((r) => (
          <article key={r.id} className="rounded-lg bg-offwhite p-4 ring-1 ring-nude/20">
            <div className="flex items-center gap-2">
              <Stars value={r.rating} />
              <span className="text-sm font-medium text-ink">{r.author}</span>
            </div>
            {r.comment && <p className="mt-2 text-sm leading-relaxed text-ink/80">{r.comment}</p>}
          </article>
        ))}
        {data && data.count === 0 && (
          <p className="text-sm text-ink/50">
            Ainda não há avaliações deste produto. Compre e seja a primeira pessoa a avaliar.
          </p>
        )}
      </div>
    </section>
  );
}
