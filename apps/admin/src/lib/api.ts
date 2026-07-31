const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export function getToken() {
  return localStorage.getItem('dc_access') || '';
}

export function getRefresh() {
  return localStorage.getItem('dc_refresh') || '';
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('dc_access', access);
  localStorage.setItem('dc_refresh', refresh);
}

export function clearTokens() {
  localStorage.removeItem('dc_access');
  localStorage.removeItem('dc_refresh');
  localStorage.removeItem('dc_user');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && getRefresh()) {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: getRefresh() }),
    });
    if (refreshed.ok) {
      const data = await refreshed.json();
      setTokens(data.accessToken, data.refreshToken);
      return api(path, options);
    }
    clearTokens();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(Array.isArray(err.message) ? err.message.join(', ') : err.message || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res as unknown as T;
}

export { API_URL };
