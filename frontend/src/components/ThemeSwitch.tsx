interface ThemeSwitchProps {
  isLight: boolean;
  onToggle: () => void;
  className?: string;
}

export function ThemeSwitch({ isLight, onToggle, className }: ThemeSwitchProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      title={isLight ? 'Modo claro activado' : 'Modo oscuro activado'}
      className={`group relative inline-flex h-9 w-20 items-center rounded-full border px-1 transition ${
        isLight
          ? 'border-slate-300 bg-white/80 text-slate-700 hover:border-cyan-400/80'
          : 'border-slate-600/70 bg-slate-900/80 text-slate-200 hover:border-cyan-400/70'
      } ${className ?? ''}`}
    >
      <span className="pointer-events-none absolute left-2 text-amber-400">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm9-5a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1ZM5 12a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1Zm11.95-6.364a1 1 0 0 1 1.414 0l.707.707a1 1 0 1 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414Zm-10.607 10.607a1 1 0 0 1 1.414 0l.707.707a1 1 0 1 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414Zm12.02 1.414a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 0 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414ZM7.757 7.05a1 1 0 0 1-1.414 0l-.707-.707A1 1 0 0 1 7.05 4.93l.707.707a1 1 0 0 1 0 1.414Z" />
        </svg>
      </span>
      <span className={`pointer-events-none absolute right-2 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12.8 2.8a1 1 0 0 0-1.2 1.27A8 8 0 1 1 4.07 14.6a1 1 0 0 0-1.27 1.2A10 10 0 1 0 12.8 2.8Z" />
        </svg>
      </span>
      <span
        className={`relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-transform duration-300 ${
          isLight ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-900'
        } ${
          isLight ? 'translate-x-0' : 'translate-x-11'
        }`}
      >
        {isLight ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-500" fill="currentColor">
            <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm9-5a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1ZM5 12a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-700" fill="currentColor">
            <path d="M12.8 2.8a1 1 0 0 0-1.2 1.27A8 8 0 1 1 4.07 14.6a1 1 0 0 0-1.27 1.2A10 10 0 1 0 12.8 2.8Z" />
          </svg>
        )}
      </span>
    </button>
  );
}
