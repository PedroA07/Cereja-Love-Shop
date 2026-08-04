'use client';

import { useState } from 'react';
import { Button, IconStar } from '@cereja/ui';
import { formatDate } from '@/lib/api';
import { useAction, useApi } from '@/lib/use-api';

interface PendingReview {
  id: string;
  rating: number;
  comment: string | null;
  product: string;
  author: string;
  createdAt: string;
}

interface PendingList {
  items: PendingReview[];
  total: number;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-cereja">
      {[1, 2, 3, 4, 5].map((n) => (
        <IconStar key={n} size={14} filled={n <= value} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { data, loading, error, reload } = useApi<PendingList>('/engagement/admin/reviews/pending');
  const action = useAction();
  const [busy, setBusy] = useState<string | null>(null);

  async function moderate(id: string, status: 'approved' | 'rejected') {
    setBusy(id);
    try {
      await action(`/engagement/admin/reviews/${id}/moderate`, 'POST', { status });
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao moderar');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-vinho">Avaliações</h1>
      <p className="mt-1 text-sm text-ink/60">
        Avaliações aguardando moderação. Só aparecem na loja depois de aprovadas.
      </p>

      {loading && <p className="mt-6 text-ink/50">Carregando…</p>}
      {error && <p className="mt-6 text-cereja">{error}</p>}

      {data && (
        <div className="mt-6 flex flex-col gap-3">
          {data.items.map((r) => (
            <article key={r.id} className="rounded-lg bg-offwhite p-4 ring-1 ring-nude/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-ink">{r.product}</span>
                  <span className="ml-2 text-xs text-ink/50">
                    {r.author} · {formatDate(r.createdAt)}
                  </span>
                </div>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="mt-2 text-sm text-ink/80">{r.comment}</p>}
              <div className="mt-3 flex gap-2">
                <Button size="sm" disabled={busy === r.id} onClick={() => void moderate(r.id, 'approved')}>
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === r.id}
                  onClick={() => void moderate(r.id, 'rejected')}
                >
                  Rejeitar
                </Button>
              </div>
            </article>
          ))}
          {data.items.length === 0 && (
            <p className="rounded-lg bg-offwhite p-8 text-center text-ink/50 ring-1 ring-nude/20">
              Nenhuma avaliação pendente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
