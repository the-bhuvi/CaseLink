export type UserRole = 'complainant' | 'officer' | 'supervisor' | 'admin';

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  bureau_code?: string | null;
}

export interface DemoLoginRequest {
  email: string;
  display_name?: string;
  role?: UserRole;
  bureau_code?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
