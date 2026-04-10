import { clearTokens, getRefreshToken, getToken, setTokens } from './auth-storage';
import type { RefreshTokenResponse } from '@/types/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
// const BASE_URL = 'http://76.13.192.114:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const json = (await res.json()) as RefreshTokenResponse;
    if (!json.success || !json.data) return false;

    setTokens(json.data.token, json.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function redirectToLogin(): void {
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const json: unknown = await res.json();

  const isUnauthorized =
    typeof json === 'object' &&
    json !== null &&
    'success' in json &&
    !(json as { success: unknown }).success &&
    'error' in json &&
    (json as { error: unknown }).error === 'UNAUTHORIZED';

  if (isUnauthorized) {
    if (!refreshPromise) {
      refreshPromise = tryRefreshToken().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;

    if (refreshed) {
      return apiClient<T>(path, init);
    }

    redirectToLogin();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!res.ok) {
    throw new ApiError(res.status, `Request failed: ${res.status} ${res.statusText}`);
  }

  if (
    typeof json !== 'object' ||
    json === null ||
    !('success' in json) ||
    !(json as { success: unknown }).success
  ) {
    throw new ApiError(res.status, 'API returned an unsuccessful response');
  }

  return json as T;
}
