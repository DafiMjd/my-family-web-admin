import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { setTokens } from '@/lib/auth-storage';
import type { LoginRequest } from '@/types/auth';

export function useLogin() {
  return useMutation({
    mutationFn: (body: LoginRequest) => authService.login(body),
    onSuccess: (data) => {
      setTokens(data.data.token, data.data.refreshToken);
    },
  });
}
