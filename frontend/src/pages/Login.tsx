import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';

import { ThemeSwitch } from '../components/ThemeSwitch';
import logo from '../assets/logo.png';
import { useAuth } from '../auth/auth-context';
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
      <div className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <p className="text-slate-300">Cargando sesion...</p>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await auth.login(login, password);
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError('No se pudo iniciar sesion.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 md:py-12 ${
        isLight
          ? 'bg-gradient-to-br from-slate-100 via-cyan-50 to-indigo-100'
          : 'bg-slate-950'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_18%,rgba(14,165,233,0.25),transparent_38%),radial-gradient(circle_at_90%_8%,rgba(59,130,246,0.3),transparent_40%),radial-gradient(circle_at_50%_95%,rgba(16,185,129,0.18),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.24)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-0 h-80 w-80 rounded-full bg-blue-600/30 blur-3xl" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-700/60 bg-slate-900/85 shadow-[0_36px_95px_-35px_rgba(2,6,23,0.95)] backdrop-blur-md md:grid-cols-[1.08fr_1fr]">
        <div className="hidden border-r border-slate-700/60 bg-gradient-to-br from-cyan-600/90 via-sky-500/80 to-blue-700/90 p-10 text-white md:flex md:flex-col md:justify-between">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-white/45 bg-white/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
              Inventario + Ventas
            </span>
            <h2 className="text-4xl font-bold leading-tight md:text-[2.55rem]">
              Sistema de Inventarios Sanchez
            </h2>
            <p className="max-w-sm text-sm text-white/85">
              Opera stock, movimientos y ventas por sucursal desde una sola vista.
            </p>
          </div>
          <p className="text-sm font-medium text-white/80">
            Realizado por: Yamil Medina y Daniel Batuani
          </p>
        </div>

        <form className="space-y-6 p-7 sm:p-9 md:p-10" onSubmit={onSubmit}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Logo del sistema"
                className="h-10 w-10 rounded-lg object-cover"
              />
              <h1 className="text-3xl font-bold text-white">Inicio de sesion</h1>
            </div>
            <ThemeSwitch
              isLight={isLight}
              onToggle={() => {
                const nextTheme = theme === 'dark' ? 'light' : 'dark';
                setTheme(nextTheme);
                applyTheme(nextTheme);
              }}
            />
          </div>
          <p className="text-sm text-slate-400">
            Ingresa tu usuario o email y contrasena para continuar.
          </p>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Usuario o email
              </label>
              <input
                type="text"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Contrasena
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                required
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-red-400/50 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-900/35 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
