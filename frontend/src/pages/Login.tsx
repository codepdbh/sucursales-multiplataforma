import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Lock, LogIn, Mail } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import logo from '../assets/logo.png';
import { useAuth } from '../auth/auth-context';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { Button, Field, Input, Panel } from '../components/dashboard/ui';
import { applyTheme, getInitialTheme } from '../lib/theme';

export const Login = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const isLight = theme === 'light';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  if (auth.isLoading) {
    return (
      <div className="login-shell grid place-items-center px-4 text-[color:var(--text)]">
        <Panel className="p-5 text-sm font-semibold">Cargando sesion...</Panel>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await auth.login(login, password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo iniciar sesion.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-shell flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shadow)] lg:grid-cols-[0.95fr_1fr]">
        <section className="hidden border-r border-[color:var(--border)] bg-[color:var(--surface-muted)] p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <img alt="Logo del sistema" className="h-16 w-auto object-contain" src={logo} />
            <h1 className="mt-8 max-w-sm text-3xl font-extrabold text-[color:var(--text-strong)]">
              Sistema Inventario y Ventas
            </h1>
            <p className="mt-3 max-w-sm text-sm font-semibold text-[color:var(--text-muted)]">
              Control operativo para sucursales, stock, ventas y liquidaciones.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['Stock', 'Ventas', 'Reportes'].map((label) => (
              <div
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-sm font-extrabold text-[color:var(--text-strong)]"
                key={label}
              >
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="ui-eyebrow">Acceso</p>
              <h2 className="text-2xl font-extrabold text-[color:var(--text-strong)]">
                Iniciar sesion
              </h2>
            </div>
            <ThemeSwitch
              isLight={isLight}
              onToggle={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            />
          </div>

          <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
            <Field label="Usuario o email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                <Input
                  autoComplete="username"
                  className="ui-input-with-icon"
                  onChange={(event) => setLogin(event.target.value)}
                  required
                  value={login}
                />
              </div>
            </Field>
            <Field label="Contrasena">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                <Input
                  autoComplete="current-password"
                  className="ui-input-with-icon"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>
            </Field>

            {error ? (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <Button disabled={isSubmitting} icon={<LogIn />} type="submit" variant="primary">
              {isSubmitting ? 'Ingresando...' : 'Entrar'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
};
