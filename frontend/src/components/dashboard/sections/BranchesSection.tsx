/* eslint-disable @typescript-eslint/no-explicit-any */
export function BranchesSection(props: any) {
  const {
    branchEdit,
    branchForm,
    branches,
    formatDate,
    onCreateBranch,
    onEditBranch,
    setBranchEdit,
    setBranchForm,
  } = props;

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="mb-3 text-lg font-semibold">Sucursales</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-2">Nombre</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Actualizado</th>
                <th className="pb-2">Accion</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch: any) => (
                <tr key={branch.id} className="border-t border-slate-800">
                  <td className="py-2">{branch.name}</td>
                  <td>{branch.isActive ? 'Activa' : 'Inactiva'}</td>
                  <td>{formatDate(branch.updatedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800"
                      onClick={() =>
                        setBranchEdit({
                          id: branch.id,
                          name: branch.name,
                          isActive: branch.isActive,
                        })
                      }
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-4">
        <form
          className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
          onSubmit={(event) => void onCreateBranch(event)}
        >
          <h3 className="text-lg font-semibold">Nueva sucursal</h3>
          <input
            value={branchForm.name}
            onChange={(event) =>
              setBranchForm((prev: any) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Nombre"
            className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Crear sucursal
          </button>
        </form>

        <form
          className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
          onSubmit={(event) => void onEditBranch(event)}
        >
          <h3 className="text-lg font-semibold">Editar sucursal</h3>
          <select
            value={branchEdit.id}
            onChange={(event) => {
              const selected = branches.find((branch: any) => branch.id === event.target.value);
              setBranchEdit({
                id: selected?.id ?? '',
                name: selected?.name ?? '',
                isActive: selected?.isActive ?? true,
              });
            }}
            className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="">Selecciona sucursal</option>
            {branches.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <input
            value={branchEdit.name}
            onChange={(event) =>
              setBranchEdit((prev: any) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Nuevo nombre"
            className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={branchEdit.isActive}
              onChange={(event) =>
                setBranchEdit((prev: any) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            Sucursal activa
          </label>
          <button
            type="submit"
            className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </section>
  );
}
