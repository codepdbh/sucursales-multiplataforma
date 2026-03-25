import { useState } from "react"
import { useAuth } from "../auth/AuthProvider";
import { Navigate } from "react-router-dom";

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const auth = useAuth();

  if (auth.isAuthenticated){
    return <Navigate to ="/dashboard"/>
  }
    return (
    // <form action="">
    //     <h1>Inicio de Sesión</h1>
    //     <label >Usuario</label>
    //     <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
    //     <label >Contraseña</label>
    //     <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
    //     <button>Iniciar Sesión</button>
    // </form>
     <div className="min-h-screen bg-slate-950 px-4 flex items-center justify-center">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-slate-900 shadow-2xl md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-cyan-500 to-blue-700 p-10 text-white">
        <div>
          <h2 className="text-4xl font-bold leading-tight">Sistema de Inventarios Sanchez</h2>
          <p className="mt-4 max-w-sm text-sm text-white/80">
            Sistema integral de stock y registro de ventas.
          </p>
        </div>
        <p className="text-sm text-white/70">Realizado por: Yamil Medina y Daniel Batuani</p>
      </div>

      <form className="p-8 md:p-10">
        <h1 className="text-3xl font-bold text-white">Inicio de Sesión</h1>
        <p className="mt-2 text-sm text-slate-400">Ingresa tus credenciales para continuar</p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-cyan-500 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Iniciar Sesión
          </button>
        </div>
      </form>
    </div>
  </div>
  )
}
