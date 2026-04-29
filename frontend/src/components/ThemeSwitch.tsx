import { Moon, Sun } from 'lucide-react';

import { cn } from '../lib/cn';

interface ThemeSwitchProps {
  className?: string;
  isLight: boolean;
  onToggle: () => void;
}

export function ThemeSwitch({ className, isLight, onToggle }: ThemeSwitchProps) {
  return (
    <button
      aria-checked={isLight}
      aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      className={cn('ui-button ui-button-secondary', className)}
      onClick={onToggle}
      role="switch"
      title={isLight ? 'Modo claro' : 'Modo oscuro'}
      type="button"
    >
      {isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span>{isLight ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}
