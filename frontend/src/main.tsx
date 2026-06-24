import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App.tsx';
import { AuthProvider } from './auth/AuthProvider.tsx';
import './index.css';
import { Dashboard, Login, Signup } from './pages/index.ts';
import ProtectedRoute from './pages/ProtectedRoute.tsx';

const basename =
  import.meta.env.BASE_URL === '/'
    ? '/'
    : import.meta.env.BASE_URL.replace(/\/$/, '');

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/signup',
      element: <Signup />,
    },
    {
      path: '/',
      element: <ProtectedRoute />,
      children: [
        {
          path: '/dashboard',
          element: <Dashboard />,
        },
      ],
    },
  ],
  { basename },
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
