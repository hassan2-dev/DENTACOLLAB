import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearTokens, getRefresh, getToken, refreshAccessToken, setTokens } from '../lib/api';

type User = { id: string; email: string; fullName: string; role: string };

type AuthCtx = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

function readStoredUser(): User | null {
  const raw = localStorage.getItem('dc_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function hasSessionTokens() {
  return Boolean(getToken() || getRefresh());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = readStoredUser();
    if (stored && hasSessionTokens()) return stored;
    if (stored && !hasSessionTokens()) {
      localStorage.removeItem('dc_user');
      return null;
    }
    return null;
  });
  const [ready, setReady] = useState(() => Boolean(getToken()) || !getRefresh());

  useEffect(() => {
    const onCleared = () => setUser(null);
    window.addEventListener('dc-auth-cleared', onCleared);
    return () => window.removeEventListener('dc-auth-cleared', onCleared);
  }, []);

  // Keep session across tabs when another tab refreshes tokens
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dc_user') {
        setUser(readStoredUser());
      }
      if (e.key === 'dc_access' && !e.newValue && !getRefresh()) {
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Restore access token from refresh on cold load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (getToken()) {
        if (!cancelled) setReady(true);
        return;
      }
      if (getRefresh()) {
        const ok = await refreshAccessToken();
        if (!ok && !cancelled) {
          clearTokens();
          setUser(null);
        } else if (ok && !cancelled && !user) {
          const stored = readStoredUser();
          if (stored) setUser(stored);
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      ready,
      async login(email, password) {
        const data = await api<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setTokens(data.accessToken, data.refreshToken);
        localStorage.setItem('dc_user', JSON.stringify(data.user));
        setUser(data.user);
        setReady(true);
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
    [user, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
}
