'use client';

import { formatDate } from '@/lib/api';
import { useApi } from '@/lib/use-api';

interface AuditRow {
  id: string;
  actorId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  createdAt: string;
}

interface AuditList {
  items: AuditRow[];
  total: number;
}

const ENTITY_LABEL: Record<string, string> = {
  product: 'Produto',
  inventory: 'Estoque',
  category: 'Categoria',
  coupon: 'Cupom',
  order: 'Pedido',
};

export default function AuditPage() {
  const { data, loading, error } = useApi<AuditList>('/admin/audit');

  return (
    <div>
      <h1 className="font-serif text-3xl text-vinho">Auditoria</h1>
      <p className="mt-1 text-sm text-ink/60">
        Registro de todas as ações da equipe. Dados sensíveis não são armazenados.
      </p>

      {loading && <p className="mt-6 text-ink/50">Carregando…</p>}
      {error && <p className="mt-6 text-cereja">{error}</p>}

      {data && (
        <div className="mt-6 overflow-x-auto rounded-lg bg-offwhite ring-1 ring-nude/20">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="border-b border-nude/30 text-left text-xs uppercase text-ink/50">
              <tr>
                <th className="p-3">Quando</th>
                <th className="p-3">Ação</th>
                <th className="p-3">Entidade</th>
                <th className="p-3">Registro</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a.id} className="border-b border-nude/20 last:border-0">
                  <td className="p-3 whitespace-nowrap text-ink/70">{formatDate(a.createdAt)}</td>
                  <td className="p-3 font-mono text-xs">{a.action}</td>
                  <td className="p-3">{a.entity ? (ENTITY_LABEL[a.entity] ?? a.entity) : '—'}</td>
                  <td className="p-3 font-mono text-xs text-ink/50">
                    {a.entityId ? a.entityId.slice(0, 8).toUpperCase() : '—'}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-ink/50">
                    Nenhuma ação registrada ainda.
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
