'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/use-login';
import { hasToken } from '@/lib/auth-storage';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending, error } = useLogin();

  useEffect(() => {
    if (hasToken()) {
      router.replace('/dashboard');
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login(
      { username, password },
      {
        onSuccess: () => {
          router.replace('/dashboard');
        },
      },
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#212121] p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-[#242424]">Family Tree Admin</h1>
          <p className="text-sm text-[#909090]">Sign in to manage family data</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium text-[#242424]">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              className="w-full rounded-lg border border-[#E0E0E0] bg-white px-3 py-2.5 text-sm text-[#242424] outline-none focus:border-[#242424] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[#242424]">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full rounded-lg border border-[#E0E0E0] bg-white px-3 py-2.5 text-sm text-[#242424] outline-none focus:border-[#242424] transition-colors"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-500">{error.message}</p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-[#242424] py-2.5 text-sm font-semibold text-white disabled:opacity-50 active:scale-95 transition-transform"
          >
            {isPending ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
