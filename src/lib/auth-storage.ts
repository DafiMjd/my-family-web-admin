const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/; SameSite=Strict`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match?.[2] ?? null;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
}

export function getToken(): string | null {
  return getCookie(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_KEY);
}

export function setTokens(token: string, refreshToken: string): void {
  setCookie(TOKEN_KEY, token);
  setCookie(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  deleteCookie(TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
}

export function hasToken(): boolean {
  return Boolean(getCookie(TOKEN_KEY));
}
