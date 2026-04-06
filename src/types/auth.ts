export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  token: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: true;
  data: AuthUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenData {
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: true;
  data: RefreshTokenData;
}
