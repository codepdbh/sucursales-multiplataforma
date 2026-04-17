import { Link } from 'react-router-dom';

export const Signup = () => {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 p-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.3),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(59,130,246,0.35),transparent_42%)]" />
      <div className="relative w-full max-w-xl rounded-4xl border border-slate-700 bg-slate-900/90 p-8 shadow-[0_36px_95px_-35px_rgba(2,6,23,0.95)] backdrop-blur-md sm:p-10">
        <span className="inline-flex rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-cyan-300">
          MODULO PENDIENTE
        </span>
        <h1 className="mt-4 text-3xl font-bold">Registro aun no habilitado</h1>
        <p className="mt-3 text-slate-300">
          El acceso actual se realiza por usuarios creados desde administracion.
          Si quieres, en el siguiente paso integramos alta de usuarios aqui.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-400"
        >
          Volver al login
        </Link>
      </div>
    </div>
  );
};
