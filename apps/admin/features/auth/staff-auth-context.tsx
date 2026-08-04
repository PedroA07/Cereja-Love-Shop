'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  permissions: string[];
}

interface StaffAuthValue {
  staff: StaffUser | null;
  loading: boolean;
  login: (email: string, password: string, totp: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
  can: (permission: string) => boolean;
}

const StaffAuthContext = createContext<StaffAuthValue | null>(null);

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  // Re-hidrata a sessão pelo refresh cookie
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { accessToken } = await apiFetch<{ accessToken: string }>('/staff/auth/refresh', {
          method: 'POST',
        });
        tokenRef.current = accessToken;
        const me = await apiFetch<StaffUser>('/staff/auth/me', { accessToken });
        if (active) setStaff(me);
      } catch {
        if (active) setStaff(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, totp: string) => {
    const res = await apiFetch<{ staff: StaffUser; accessToken: string }>('/staff/auth/login', {
      method: 'POST',
      body: { email, password, totp },
    });
    tokenRef.current = res.accessToken;
    setStaff(res.staff);
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/staff/auth/logout', { method: 'POST' }).catch(() => undefined);
    tokenRef.current = null;
    setStaff(null);
  }, []);

  const getAccessToken = useCallback(() => tokenRef.current, []);
  const can = useCallback(
    (permission: string) => staff?.permissions.includes(permission) ?? false,
    [staff],
  );

  const value = useMemo<StaffAuthValue>(
    () => ({ staff, loading, login, logout, getAccessToken, can }),
    [staff, loading, login, logout, getAccessToken, can],
  );

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}

export function useStaffAuth(): StaffAuthValue {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error('useStaffAuth deve ser usado dentro de StaffAuthProvider');
  return ctx;
}
