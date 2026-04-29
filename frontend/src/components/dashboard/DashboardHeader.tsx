import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  LogOut,
  PackageSearch,
  ShoppingCart,
  SunMoon,
  Users,
} from 'lucide-react';

import logo from '../../assets/logo.png';
import { Button, IconButton } from './ui';

interface DashboardTabItem {
  key: string;
  label: string;
}

interface DashboardHeaderProps {
  activeTab: string;
  activeTabHint: string;
  isLight: boolean;
  onLogout: () => void;
  onTabChange: (tabKey: string) => void;
  onToggleTheme: () => void;
  tabs: DashboardTabItem[];
  user: {
    branchName?: string | null;
    role?: string | null;
    username?: string | null;
  };
}

const TAB_ICONS: Record<string, typeof BarChart3> = {
  overview: BarChart3,
  products: PackageSearch,
  inventory: Boxes,
  sales: ShoppingCart,
  users: Users,
  branches: Building2,
  reports: ClipboardList,
};

export function DashboardHeader({
  activeTab,
  activeTabHint,
  isLight,
  onLogout,
  onTabChange,
  onToggleTheme,
  tabs,
  user,
}: DashboardHeaderProps) {
  return (
    <aside className="dashboard-sidebar">
      <div className="flex h-full flex-col gap-5 p-4">
        <div className="flex items-center gap-3 border-b border-[color:var(--border)] pb-4">
          <img alt="Logo del sistema" className="h-11 w-11 rounded-lg object-contain" src={logo} />
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold text-[color:var(--text-strong)]">
              Inventario y Ventas
            </h1>
            <p className="truncate text-xs font-semibold text-[color:var(--text-muted)]">
              Sucursales Sanchez
            </p>
          </div>
        </div>

        <nav className="grid gap-1">
          {tabs.map((tab) => {
            const Icon = TAB_ICONS[tab.key] ?? BarChart3;
            const isActive = activeTab === tab.key;

            return (
              <button
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-bold transition ${
                  isActive
                    ? 'bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                    : 'text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]'
                }`}
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                type="button"
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto grid gap-3 border-t border-[color:var(--border)] pt-4">
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
            <p className="text-sm font-extrabold text-[color:var(--text-strong)]">
              {user.username ?? 'Usuario'}
            </p>
            <p className="mt-1 text-xs font-semibold text-[color:var(--text-muted)]">
              {user.role ?? 'Sin rol'} / {user.branchName ?? 'Sin sucursal'}
            </p>
            <p className="mt-3 text-xs text-[color:var(--text-muted)]">{activeTabHint}</p>
          </div>

          <div className="flex gap-2">
            <IconButton label={isLight ? 'Cambiar a oscuro' : 'Cambiar a claro'} onClick={onToggleTheme}>
              <SunMoon />
            </IconButton>
          </div>
          <Button icon={<LogOut />} onClick={onLogout} variant="danger">
            Cerrar sesion
          </Button>
        </div>
      </div>
    </aside>
  );
}
