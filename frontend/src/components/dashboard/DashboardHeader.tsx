import logo from '../../assets/logo.png';
import { ThemeSwitch } from '../ThemeSwitch';

interface DashboardTabItem {
  key: string;
  label: string;
}

interface DashboardHeaderProps {
  activeTab: string;
  activeTabHint: string;
  isLight: boolean;
  onLogout: () => void;
  onReloadData: () => void;
  onTabChange: (tabKey: string) => void;
  onToggleTheme: () => void;
  tabs: DashboardTabItem[];
  user: {
    branchName?: string | null;
    role?: string | null;
    username?: string | null;
  };
}

export function DashboardHeader({
  activeTab,
  activeTabHint,
  isLight,
  onLogout,
  onReloadData,
  onTabChange,
  onToggleTheme,
  tabs,
  user,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-hero -mx-4 border-y border-slate-700/80 bg-slate-900/85 px-4 py-5 shadow-xl backdrop-blur-md md:-mx-6 md:px-6 md:py-6 lg:-mx-8 lg:px-8">
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_auto] xl:items-center">
        <div className="flex justify-center xl:justify-start">
          <img
            src={logo}
            alt="Logo del sistema"
            className="h-16 w-full max-w-[240px] object-contain object-left"
          />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Panel operativo
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">Sistema Inventario y Ventas</h1>
          <p className="text-sm text-slate-300">Gestion operativa por roles y sucursales</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 xl:justify-end">
          <ThemeSwitch isLight={isLight} onToggle={onToggleTheme} />
          <button
            type="button"
            className="ui-secondary-btn rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            onClick={onReloadData}
          >
            Recargar datos
          </button>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-cyan-500/25 text-cyan-300">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c1.8-4 5-6 8-6s6.2 2 8 6" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-100">{user.username}</p>
              <p className="text-xs text-slate-400">
                {user.role} | {user.branchName ?? 'Sin sucursal'}
              </p>
            </div>
            <button
              type="button"
              className="ui-danger-btn rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-400"
              onClick={onLogout}
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <div className="inline-flex flex-wrap justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-950/40 p-2 shadow-[0_16px_35px_-24px_rgba(8,47,73,0.7)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_10px_24px_-14px_rgba(6,182,212,0.85)]'
                  : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-3 max-w-3xl rounded-full border border-slate-700/80 bg-slate-950/50 px-4 py-2 text-center text-sm text-slate-300">
        {activeTabHint}
      </p>
    </header>
  );
}
