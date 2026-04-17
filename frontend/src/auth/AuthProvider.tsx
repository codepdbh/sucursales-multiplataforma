import { useEffect, useState } from 'react';

import type { AuthUser } from './auth-context';
import { AuthContext } from './auth-context';

interface AuthProviderProps {
  children: React.ReactNode;
}

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
}

const TOKEN_STORAGE_KEY = 'inventory_access_token';
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3012/api';

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );

  useEffect(() => {
    async function loadCurrentUser() {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Token inválido o sesión expirada.');
        }

        const me = (await response.json()) as AuthUser;
        setUser(me);
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void loadCurrentUser();
  }, [token]);

  async function login(loginValue: string, password: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: loginValue,
        password,
      }),
    });

    if (!response.ok) {
      let message = 'No se pudo iniciar sesión.';

      try {
        const payload = (await response.json()) as { message?: string | string[] };
        if (Array.isArray(payload.message)) {
          message = payload.message.join(', ');
        } else if (payload.message) {
          message = payload.message;
        }
      } catch {
        // Keep default message.
      }

      throw new Error(message);
    }

    const data = (await response.json()) as LoginResponse;
    localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
  }

  function logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
