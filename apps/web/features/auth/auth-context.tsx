'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

export interface CustomerUser {
  id: string;
  email: string;
  name: string;
  status: string;
  twoFactorEnabled: boolean;
}

interface AuthResponse {
  user: CustomerUser;
  accessToken: string;
  expiresIn: number;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone?: string;
  acceptedTerms: boolean;
  marketingConsent?: boolean;
}

interface AuthContextValue {
  user: CustomerUser | null;
  loading: boolean;
  login: (email: string, password: string, totp?: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const applySession = useCallback((res: AuthResponse) => {
    tokenRef.current = res.accessToken;
    setUser(res.user);
  }, []);

  // Re-hidrata a sessão a partir do refresh cookie httpOnly.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { accessToken } = await apiFetch<{ accessToken: string }>('/auth/refresh', {
          method: 'POST',
        });
        tokenRef.current = accessToken;
        const me = await apiFetch<CustomerUser>('/auth/me', { accessToken });
        if (active) setUser(me);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string, totp?: string) => {
      const res = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password, ...(totp ? { totp } : {}) },
      });
      applySession(res);
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const res = await apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: input });
      applySession(res);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
    tokenRef.current = null;
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout, accessToken: tokenRef.current }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
