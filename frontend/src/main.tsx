import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Signup, Login , Dashboard } from './pages/index.ts'
import ProtectedRoute from './pages/ProtectedRoute.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'



  const router = createBrowserRouter([
    {
      path: "/",
      element: <App/>,
    },
    {
      path: "/login",
      element: <Login/>,
    },
    {
      path: "/signup",
      element: <Signup/>,
    },
    {
      path: "/",
      element: <ProtectedRoute/>,
      children: [
        {
          path:"/dashboard",
          element: <Dashboard/>,
        }
      ]
    },
    
  ])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router}/>
    </AuthProvider>
  </StrictMode>,
)
