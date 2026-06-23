import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function normalizeBasePath(basePath?: string): string {
  if (!basePath || basePath === '/') {
    return '/';
  }

  const withLeadingSlash = basePath.startsWith('/')
    ? basePath
    : `/${basePath}`;

  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: normalizeBasePath(env.VITE_APP_BASE_PATH),
    plugins: [react(), tailwindcss()],
  };
});
