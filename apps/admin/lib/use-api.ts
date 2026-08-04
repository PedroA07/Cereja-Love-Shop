'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api';
import { useStaffAuth } from '@/features/auth/staff-auth-context';

/** Busca dados autenticados do painel, com recarga sob demanda. */
export function useApi<T>(path: string | null) {
  const { getAccessToken } = useStaffAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await apiFetch<T>(path, { accessToken: getAccessToken() ?? undefined }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [path, getAccessToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}

/** Executa ações (POST/PATCH) autenticadas. */
export function useAction() {
  const { getAccessToken } = useStaffAuth();
  return useCallback(
    <T,>(path: string, method: string, body?: unknown) =>
      apiFetch<T>(path, { method, body, accessToken: getAccessToken() ?? undefined }),
    [getAccessToken],
  );
}
