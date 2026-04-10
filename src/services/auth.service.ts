import { apiClient } from '@/lib/api-client';
import type { LoginRequest, LoginResponse } from '@/types/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
// const BASE_URL = 'http://76.13.192.114:3001';

export const authService = {
  login: (body: LoginRequest): Promise<LoginResponse> =>
    fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (res) => {
      const json = (await res.json()) as LoginResponse;
      if (!res.ok || !json.success) {
        throw new Error((json as unknown as { message?: string }).message ?? 'Login failed');
      }
      return json;
    }),
};
