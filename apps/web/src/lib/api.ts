const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const locale = localStorage.getItem('dentacollab-locale') === 'en' ? 'en' : 'ar';
  const localizedPath = `${path}${path.includes('?') ? '&' : '?'}locale=${locale}`;
  const res = await fetch(`${API_URL}${localizedPath}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export { API_URL };
