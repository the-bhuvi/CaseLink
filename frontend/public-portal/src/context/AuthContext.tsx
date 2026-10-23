import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, DemoLoginRequest } from '@/types/auth';
import { apiClient, clearAuthToken, getAuthToken, setAuthToken } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload?: DemoLoginRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userData = await apiClient.getMe();
      setUser(userData);
      setTokenState(currentToken);
    } catch (err: any) {
      console.warn('Session restoration failed:', err);
      clearAuthToken();
      setTokenState(null);
      setUser(null);
      if (err?.code !== 'SERVICE_UNAVAILABLE') {
        setError('Your session has expired. Please sign in again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (payload?: DemoLoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.demoLogin(payload);
      setAuthToken(response.access_token);
      setTokenState(response.access_token);
      setUser(response.user);
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Please check backend connection.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    setTokenState(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
