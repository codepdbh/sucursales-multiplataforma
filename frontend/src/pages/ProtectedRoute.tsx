import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../auth/auth-context';

export default function ProtectedRoute() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white grid place-items-center">
        <p className="text-slate-300">Validando sesión...</p>
      </div>
    );
  }

  return auth.isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

