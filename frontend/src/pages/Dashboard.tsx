export const Dashboard = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[88px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside className="border-r border-slate-800 bg-slate-900">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-5 lg:px-6">
            <div className="hidden lg:block">
              <h1 className="text-xl font-bold">Mi Sistema</h1>
              <p className="text-xs text-slate-400">Administración</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 font-bold text-slate-950">
              M
            </div>
          </div>

          <nav className="flex-1 px-3 pb-4">
            <div className="grid gap-2">
              {[
                "Ventas",
                "Inventarios",
                "Reportes de Ventas",
                "Usuarios",
              ].map((item) => (
                <button
                  key={item}
                  className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white lg:px-5"
                >
                  <span className="hidden lg:inline">{item}</span>
                  <span className="lg:hidden">{item.charAt(0)}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="border-t border-slate-800 p-3 lg:p-4">
            <div className="rounded-2xl bg-slate-800 p-3 lg:p-4">
              <p className="text-xs text-slate-400">Usuario Logeado</p>
              <button className="mt-3 w-full rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="px-4 py-5 md:px-5 lg:px-8">
        <header className="mb-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-900/70 p-5 shadow-2xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm text-cyan-400">Panel de control</p>
              <h2 className="mt-1 text-3xl font-bold">Dashboard operativo</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/60 p-2">
              <button className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
                Sucursal 1
              </button>
              <button className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800">
                Sucursal 2
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <p className="text-sm text-slate-400">Ventas</p>
            <h3 className="mt-3 text-3xl font-bold">0</h3>
            <p className="mt-2 text-sm text-slate-500">Resumen de ventas del día</p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <p className="text-sm text-slate-400">Inventarios</p>
            <h3 className="mt-3 text-3xl font-bold">0</h3>
            <p className="mt-2 text-sm text-slate-500">Stock disponible por sucursal</p>
          </div>
        </section>
      </main>
    </div>
  </div>
  )
}
