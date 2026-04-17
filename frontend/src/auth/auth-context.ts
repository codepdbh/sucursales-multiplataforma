import { createContext, useContext } from 'react';

export type UserRole = 'OWNER' | 'ADMIN' | 'REGISTRADOR';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  branch?: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}

