import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { api, clearTokens, setTokens } from '../lib/api';

type User = { id: string; email: string; fullName: string; role: string };

type AuthCtx = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('dc_user');
    return raw ? JSON.parse(raw) : null;
  });

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      async login(email, password) {
        const data = await api<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setTokens(data.accessToken, data.refreshToken);
        localStorage.setItem('dc_user', JSON.stringify(data.user));
        setUser(data.user);
      },
      async logout() {
        const refresh = localStorage.getItem('dc_refresh');
        if (refresh) {
          try {
            await api('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: refresh }) });
          } catch {
            /* ignore */
          }
        }
        clearTokens();
        setUser(null);
      },
    }),
    [user],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
}
