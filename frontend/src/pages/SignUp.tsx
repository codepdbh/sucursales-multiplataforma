import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Panel } from '../components/dashboard/ui';

export const Signup = () => {
  return (
    <div className="login-shell grid min-h-screen place-items-center px-4 py-8">
      <Panel className="w-full max-w-lg p-6">
        <p className="ui-eyebrow">Accesos</p>
        <h1 className="text-2xl font-extrabold text-[color:var(--text-strong)]">
          Registro no habilitado
        </h1>
        <p className="mt-3 text-sm font-semibold text-[color:var(--text-muted)]">
          Los usuarios se crean desde el panel administrativo.
        </p>
        <Link className="ui-button ui-button-secondary mt-6" to="/login">
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al login</span>
        </Link>
      </Panel>
    </div>
  );
};
