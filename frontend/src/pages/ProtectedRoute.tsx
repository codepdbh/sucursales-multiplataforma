import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../auth/auth-context';

export default function ProtectedRoute() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="login-shell grid min-h-screen place-items-center text-[color:var(--text)]">
        <p className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm font-semibold">
          Validando sesion...
        </p>
      </div>
    );
  }

  return auth.isAuthenticated ? <Outlet /> : <Navigate replace to="/login" />;
}
